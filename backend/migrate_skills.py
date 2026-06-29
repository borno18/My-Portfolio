import sqlite3

conn = sqlite3.connect('portfolio.db')
cur = conn.cursor()

# Check if skills table exists
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='skills'")
exists = cur.fetchone()

if not exists:
    print('skills table does not exist yet.')
    print('It will be created automatically with is_visible when you start the backend server.')
    print('No migration needed - the new column is already in the model.')
else:
    cur.execute("PRAGMA table_info(skills)")
    cols = cur.fetchall()
    col_names = [c[1] for c in cols]
    print('Skills columns:', col_names)
    if 'is_visible' not in col_names:
        cur.execute("ALTER TABLE skills ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1")
        conn.commit()
        print('Migration done: is_visible column added (all existing skills set to visible)')
    else:
        print('Column is_visible already exists - no migration needed')

conn.close()
