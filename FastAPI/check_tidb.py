"""Read-only check of the same DB configuration and connector used by FastAPI."""
import sys
from db.settings import database_config
from db.db_config import get_db_connection, get_connection_options


def main():
    connection = None
    try:
        options = get_connection_options(database_config)
        if options['ssl'] is None:
            raise ValueError('DB_SSL=true is required for this TLS check')
        connection = get_db_connection(database_config)
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1 AS ok, DATABASE() AS db')
            result = cursor.fetchone()
            assert result['ok'] == 1
            assert result['db'] == database_config['DB_DATABASE']
            cursor.execute("SHOW STATUS LIKE 'Ssl_cipher'")
            assert cursor.fetchone()['Value'], 'TLS was not negotiated'
            print('[OK] FastAPI: SELECT 1 / database / TLS cipher')
            cursor.execute('SHOW TABLES')
            names = {next(iter(row.values())) for row in cursor.fetchall()}
            required = {'Users', 'Cr_Articles', 'Reports', 'UserArticles', 'ArticleReports', 'sessions'}
            assert required.issubset(names), 'Required tables are missing'
            print('[OK] Tables: all six required tables are present')
        print('Connection check complete. No records were inserted or updated.')
    except Exception as error:
        print('[FAIL]', type(error).__name__)
        print('Check DB_* values, TiDB network rules, trusted CA certificates and the six tables.')
        return 1
    finally:
        if connection is not None:
            connection.close()
    return 0


if __name__ == '__main__':
    sys.exit(main())
