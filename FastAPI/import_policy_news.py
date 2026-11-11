r"""Import six real, attributed KOGL Type 1 text articles; preview by default.

Run from the repository root:
  py .\FastAPI\import_policy_news.py
  py .\FastAPI\import_policy_news.py --write

No AI calls, image downloads, scheduled crawling, deletes, or overwrites.
"""
import argparse
from collections import Counter, defaultdict
from datetime import datetime
import hashlib
import json
import re
import sys

from lxml import html
import requests

NEWS_IDS = ("148975521", "148974652", "148974618", "148970284", "148954629", "148974646")
URL = "https://www.korea.kr/news/policyNewsView.do?newsId={}"
LICENSE = "공공누리 제1유형(출처표시)의 조건"
COMMON_KEYWORDS = (
    "인공지능", "ai", "디지털", "경쟁력", "기술", "반도체", "산업", "경제",
    "교육", "학생", "고등학생", "농어촌", "취약계층", "윤리", "생성형",
    "의료", "병원", "중환자", "원격", "보건", "데이터", "데이터센터",
    "투자", "현대차", "새만금", "로봇", "수소", "보안", "기술유출", "법",
    "기본법", "시행령", "안전", "정책", "정부",
)


class ImportFailure(RuntimeError):
    pass


def normalize(text):
    return " ".join(text.split())


def keywords_for(title, body):
    text = (title + " " + body).lower()
    # Useful roots/aliases plus a bounded exact-token index; not semantic search.
    words = Counter(re.findall(r"[가-힣]{2,18}|[a-z]{2,30}", text))
    keys = {key for key in COMMON_KEYWORDS if key in text}
    keys.update(word for word, _ in words.most_common(60))
    if "인공지능" in keys:
        keys.add("ai")
    if "현대자동차" in text:
        keys.add("현대차")
    return sorted(keys)


def parse_article(news_id, markup):
    root = html.fromstring(markup)
    license_nodes = root.xpath('//img[contains(@src,"open_type_01")]/following-sibling::* | //span[contains(.,"공공누리 제1유형")]')
    if not license_nodes or not any(LICENSE in normalize(n.text_content()) for n in license_nodes):
        raise ImportFailure(f"Source {news_id}: text reuse notice could not be verified")
    title = normalize(root.xpath('string(//h1)'))
    bodies = root.xpath('//div[contains(concat(" ",normalize-space(@class)," ")," view_cont ")]')
    if len(bodies) != 1 or not title or len(title) > 100:
        raise ImportFailure(f"Source {news_id}: article layout/title changed")
    body_node = bodies[0]
    for node in body_node.xpath('.//script | .//style | .//figure | .//img | .//figcaption | .//*[contains(concat(" ",normalize-space(@class)," ")," imageWrap ")]'):
        if node.getparent() is not None:
            node.drop_tree()
    paragraphs = [normalize(p.text_content()) for p in body_node.xpath('.//p')]
    paragraphs = [p for p in paragraphs if p and not p.startswith("문의:")]
    body = "\n\n".join(paragraphs)
    if not 300 <= len(body) <= 100_000:
        raise ImportFailure(f"Source {news_id}: article body missing or unexpectedly sized")
    # JSON-LD carries the source's local +09:00 timestamp, unlike its OG Z label.
    publication = None
    for value in root.xpath('//script[@type="application/ld+json"]/text()'):
        try:
            info = json.loads(value)
            if isinstance(info, dict) and info.get("datePublished"):
                publication = datetime.fromisoformat(info["datePublished"]).replace(tzinfo=None)
                break
        except (ValueError, TypeError):
            continue
    if publication is None:
        raise ImportFailure(f"Source {news_id}: original publication date missing")
    department = normalize(root.xpath('string(//*[contains(@class,"article_head")]//a[contains(@class,"gotosite")]/text())'))
    source_url = URL.format(news_id)
    attribution = f"자료출처: 정책브리핑(www.korea.kr) / {department} / {publication:%Y-%m-%d}\n원문: {source_url}\n이용조건: 텍스트 공공누리 제1유형(출처표시)"
    content = body + "\n\n" + attribution
    article_id = 4_000_000_000_000 + int(news_id)
    payload = {
        "content": content, "source_url": source_url, "source_title": title,
        "source_department": department, "published_at": publication.isoformat(),
        "license": "KOGL Type 1 (text only)",
        "content_sha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
        "importer": "culink-policy-news-v1",
    }
    return {"id": article_id, "title": title, "url": source_url,
            "date": publication, "keywords": keywords_for(title, body), "payload": payload}


def fetch_articles():
    result = []
    for news_id in NEWS_IDS:
        # Fixed official URLs; credentials are never attached to source requests.
        try:
            with requests.get(URL.format(news_id), timeout=(10, 30), allow_redirects=False) as response:
                if response.status_code != 200:
                    raise ImportFailure(f"Source {news_id}: HTTP {response.status_code}")
                markup = response.content.decode("utf-8")
        except (requests.RequestException, UnicodeError):
            raise ImportFailure(f"Source {news_id}: download failed; no automatic retry") from None
        article = parse_article(news_id, markup)
        result.append(article)
        print(f"[SOURCE] {article['date']:%Y-%m-%d} | {article['title']}", flush=True)
    return result


def storage_matches(existing, article):
    try:
        data = json.loads(existing)
    except (ValueError, UnicodeError):
        return False
    desired = article["payload"]
    return (isinstance(data, dict) and data.get("importer") == desired["importer"]
            and data.get("source_url") == article["url"]
            and data.get("content") == desired["content"])


def existing_body(storage, path):
    # Object-not-found HTTP codes vary between Storage versions. Listing avoids
    # treating an authentication/network failure as permission to create a file.
    for offset in range(0, 1000, 100):
        with storage._request("POST", "object/list/" + storage.article_bucket,
                              json_body={"prefix": "", "search": path,
                                         "limit": 100, "offset": offset,
                                         "sortBy": {"column": "name", "order": "asc"}}) as response:
            entries = response.json()
        if not isinstance(entries, list):
            raise ImportFailure("Unexpected Storage object-list response")
        if any(item.get("name") == path for item in entries):
            return storage.download(storage.article_bucket, path)
        if len(entries) < 100:
            return None
    raise ImportFailure("Storage preflight listing limit reached; nothing overwritten")


def preflight(articles, connection, storage):
    plan = []
    for article in articles:
        with connection.cursor() as cursor:
            cursor.execute("SELECT cr_art_url, cr_art_title, cr_art_date FROM Cr_Articles WHERE cr_art_id=%s", (article["id"],))
            row = cursor.fetchone()
        if row and (row["cr_art_url"] != article["url"] or row["cr_art_title"] != article["title"] or row["cr_art_date"] != article["date"]):
            raise ImportFailure(f"Article ID {article['id']} conflicts with an existing DB row; nothing overwritten")
        path = f"{article['id']}.json"
        existing = existing_body(storage, path)
        if existing is not None and not storage_matches(existing, article):
            raise ImportFailure(f"Article ID {article['id']} conflicts with an existing Storage object; nothing overwritten")
        plan.append((article, row is None, existing is None))
    # Close the read transaction before the insert/verify phase.
    connection.rollback()
    return plan


def import_articles(articles):
    from db.db_config import get_db_connection, database_config
    from db.firebase_config import fire_db
    from firebase_admin import firestore
    from services.object_storage import SupabaseStorage, storage_provider
    if storage_provider() != "supabase":
        raise ImportFailure("Set STORAGE_PROVIDER=supabase in FastAPI/.env")
    storage = SupabaseStorage()
    storage.verify_buckets()
    connection = get_db_connection(database_config)
    try:
        plan = preflight(articles, connection, storage)
        print(f"[PLAN] {sum(p[1] for p in plan)} new DB rows / {sum(p[2] for p in plan)} new article objects", flush=True)
        for article, new_row, new_object in plan:
            path = f"{article['id']}.json"
            if new_object:
                raw = json.dumps(article["payload"], ensure_ascii=False).encode("utf-8")
                storage.upload(storage.article_bucket, path, raw, "application/json; charset=utf-8")
            # A network interruption may leave one layer saved. Re-running repairs
            # missing layers; it never deletes or overwrites existing data.
            if new_row:
                with connection.cursor() as cursor:
                    cursor.execute("""INSERT INTO Cr_Articles
                        (cr_art_id,cr_art_title,cr_art_img,cr_art_url,cr_art_company,cr_art_date)
                        VALUES (%s,%s,%s,%s,%s,%s)""",
                        (article["id"], article["title"], None, article["url"], "정책브리핑", article["date"]))
                connection.commit()
            batch = fire_db.batch()
            for keyword in article["keywords"]:
                ref = fire_db.collection("keyword_index").document(keyword)
                batch.set(ref, {"article_ids": firestore.ArrayUnion([article["id"]])}, merge=True)
            batch.commit(retry=None, timeout=30)
            print(f"[SAVED] {article['id']} | DB / private body / keyword index", flush=True)
        # Fresh reads verify all three layers, including every indexed keyword.
        expected = defaultdict(set)
        for article in articles:
            with connection.cursor() as cursor:
                cursor.execute("SELECT cr_art_url FROM Cr_Articles WHERE cr_art_id=%s", (article["id"],))
                row = cursor.fetchone()
            if not row or row["cr_art_url"] != article["url"]:
                raise ImportFailure("DB verification failed")
            if not storage_matches(storage.download(storage.article_bucket, f"{article['id']}.json"), article):
                raise ImportFailure("Article body verification failed")
            for keyword in article["keywords"]:
                expected[keyword].add(article["id"])
        refs = [fire_db.collection("keyword_index").document(key) for key in sorted(expected)]
        for document in fire_db.get_all(refs, retry=None, timeout=30):
            if not expected[document.id].issubset(set((document.to_dict() or {}).get("article_ids", []))):
                raise ImportFailure(f"Keyword verification failed: {document.id}")
            del expected[document.id]
        if expected:
            raise ImportFailure("Keyword verification returned incomplete results")
        print(f"[OK] {len(articles)} real articles: TiDB metadata / Supabase private bodies / Firestore index verified")
        print("[OK] No AI requests, image copies, deletes, or overwrites")
    finally:
        connection.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Import the six listed articles into the configured services")
    args = parser.parse_args()
    try:
        articles = fetch_articles()
        print(f"[OK] {len(articles)} sources: attributed KOGL Type 1 text / original dates / no photographs")
        if not args.write:
            print("Preview complete. No database, Storage, Firestore, or AI requests were made.")
            print("To save these articles: py .\\FastAPI\\import_policy_news.py --write")
            return 0
        import_articles(articles)
        return 0
    except Exception as error:
        if isinstance(error, ImportFailure):
            message = str(error)
        else:
            # Provider/network errors can carry keys or credentials; don't dump them.
            message = f"{type(error).__name__}; check configuration/connectivity (provider details hidden)"
        print(f"[FAIL] {message}", file=sys.stderr)
        if args.write:
            print("Some layers may already be saved. After fixing the cause, rerun the same command to finish missing layers.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
