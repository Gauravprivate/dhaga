try:
    import MySQLdb  # noqa: F401
except ImportError:
    import pymysql

    pymysql.version_info = (2, 2, 1, 'final', 0)
    pymysql.install_as_MySQLdb()