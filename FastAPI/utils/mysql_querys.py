

def query_metadata_from_db(id_list: list, connection):
    format_strings = ','.join(['%s'] * len(id_list))
    query = f"""
        SELECT * 
        FROM Cr_Articles 
        WHERE cr_art_id IN ({format_strings})
    """
    # print("쿼리쪽 id 리스트:", id_list)

    try:
        with connection.cursor() as cursor:
            cursor.execute(query, tuple(id_list))
            result = cursor.fetchall()
            if not result:
                print("No matching articles found.")
            return result
    except Exception as e:
        print(f"MySQL 에러:")
        # raise
    finally:
        connection.close()