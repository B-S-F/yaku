#!/usr/bin/env python3

import argparse
import hashlib
import json
import logging
import os
import pathlib
import re
import sys
import uuid
from logging import Logger

import psycopg
from psycopg import Connection, sql

UUID_PATTERN = re.compile('^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$')
MENTION_PATTERN = re.compile('@([\w\.-]+@[\w\.-]+\.\w+)')

def check_and_create_user_if_missing(username: str, usermap: dict, fakeusers: dict, logger: Logger) -> dict:
    if username in usermap:
        return usermap[username]

    # The user is not in the map, generate a fake one
    # When the service retrieves such a user later
    # the service will treat the user as deleted which is semantically correct

    # Generate a UUID v4 that is random but deterministic per username
    md5_input = f'random prefix plus username: 96d7b55b-4abc-4639-a870-28e7beedb589 {username}'
    hexstring = hashlib.md5(md5_input.encode('utf-8')).hexdigest()
    id = str(uuid.UUID(hex=hexstring, version=4))

    for user in usermap.values():
        if user['id'] == id:
            raise RuntimeError('Randomly generated UUID already assigned. Implementation error.')

    fake_user = {
        'id': id,
        'username': username,
        'email': username,
        'displayName': f'{username}'
    }

    usermap[username] = fake_user
    fakeusers[username] = fake_user

    logger.info(f'Generated fake user: {fake_user}')

    return fake_user

def migrate_audit_table(conn: Connection, table_name: str, usermap: dict, fakeusers: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("SELECT id,actor,original,modified FROM {}").format(sql.Identifier(table_name))
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            actorDb = record[1]
            original = record[2]
            modified = record[3]

            # Update 'actor' JSON
            username = actorDb.get('username')

            assert username is not None and isinstance(username, str)

            mappedUser = check_and_create_user_if_missing(username, usermap, fakeusers, logger)

            actorNew = {
                'id': mappedUser['id'],
                'email': mappedUser['email'],
                'username': mappedUser['username'],
                'displayName': mappedUser['displayName']
            }

            setDb = set(actorDb.items())
            setNew = set(actorNew.items())

            diff = setNew - setDb

            if (len(diff) != 0):
                logger.debug(f'{username} {table_name} {rowid}')
                logger.debug(f'Old actor: {actorDb}')
                logger.debug(f'New actor: {actorNew}')

                newJson = json.dumps(actorNew)
                cur.execute(
                    sql.SQL("UPDATE {} SET actor = %s WHERE id = %s").format(sql.Identifier(table_name)),
                    [newJson, rowid]
                )

            # Migrate createdBy and lastModifiedBy fields from original JSON
            if (original and 'createdBy' in original and 'lastModifiedBy' in original):
                createdBy = original['createdBy']
                lastModifiedBy = original['lastModifiedBy']

                if (UUID_PATTERN.match(createdBy) is None):
                    user = check_and_create_user_if_missing(createdBy, usermap, fakeusers, logger)
                    logger.debug(f'{table_name} {rowid}')
                    logger.debug(f'Old original ->> createdBy: {createdBy}')
                    logger.debug(f'''New original ->> createdBy: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE {} SET original = jsonb_set(original, {}, {}) WHERE id = %s""").format(sql.Identifier(table_name), sql.Literal('{createdBy}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                    )

                if (UUID_PATTERN.match(lastModifiedBy) is None):
                    user = check_and_create_user_if_missing(lastModifiedBy, usermap, fakeusers, logger)
                    logger.debug(f'{table_name} {rowid}')
                    logger.debug(f'Old original ->> lastModifiedBy: {lastModifiedBy}')
                    logger.debug(f'''New original ->> lastModifiedBy: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE {} SET original = jsonb_set(original, {}, {}) WHERE id = %s""").format(sql.Identifier(table_name), sql.Literal('{lastModifiedBy}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                )

            # Migrate createdBy and lastModifiedBy fields from modified JSON
            if (modified and 'createdBy' in modified and 'lastModifiedBy' in modified):
                createdBy = modified['createdBy']
                lastModifiedBy = modified['lastModifiedBy']

                if (UUID_PATTERN.match(createdBy) is None):
                    user = check_and_create_user_if_missing(createdBy, usermap, fakeusers, logger)
                    logger.debug(f'{table_name} {rowid}')
                    logger.debug(f'Old modified ->> createdBy: {createdBy}')
                    logger.debug(f'''New modified ->> createdBy: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE {} SET modified = jsonb_set(modified, {}, {}) WHERE id = %s""").format(sql.Identifier(table_name), sql.Literal('{createdBy}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                    )

                if (UUID_PATTERN.match(lastModifiedBy) is None):
                    user = check_and_create_user_if_missing(lastModifiedBy, usermap, fakeusers, logger)
                    logger.debug(f'{table_name} {rowid}')
                    logger.debug(f'Old modified ->> lastModifiedBy: {lastModifiedBy}')
                    logger.debug(f'''New modified ->> lastModifiedBy: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE {} SET modified = jsonb_set(modified, {}, {}) WHERE id = %s""").format(sql.Identifier(table_name), sql.Literal('{lastModifiedBy}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                )


def migrate_regular_table(conn: Connection, table_name: str, usermap: dict, fakeusers: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL('SELECT id,"createdBy","lastModifiedBy" FROM {}').format(sql.Identifier(table_name))
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            createdBy = record[1]
            lastModifiedBy = record[2]

            if (UUID_PATTERN.match(createdBy) is None):
                user = check_and_create_user_if_missing(createdBy, usermap, fakeusers, logger)
                logger.debug(f'{table_name} {rowid}')
                logger.debug(f'Old createdBy: {createdBy}')
                logger.debug(f'''New createdBy: {user['id']}''')
                cur.execute(
                    sql.SQL("""UPDATE {} SET "createdBy" = %s WHERE id = %s""").format(sql.Identifier(table_name)),
                    [user['id'], rowid]
                )

            if (UUID_PATTERN.match(lastModifiedBy) is None):
                user = check_and_create_user_if_missing(lastModifiedBy, usermap, fakeusers, logger)
                logger.debug(f'{table_name} {rowid}')
                logger.debug(f'Old lastModifiedBy: {lastModifiedBy}')
                logger.debug(f'''New lastModifiedBy: {user['id']}''')
                cur.execute(
                    sql.SQL("""UPDATE {} SET "lastModifiedBy" = %s WHERE id = %s""").format(sql.Identifier(table_name)),
                    [user['id'], rowid]
            )


def extra_migrate_approval_table(conn: Connection, usermap: dict, fakeusers: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL('SELECT id,"approver" FROM approval')
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            approver = record[1]

            if (UUID_PATTERN.match(approver) is None):
                user = check_and_create_user_if_missing(approver, usermap, fakeusers, logger)
                logger.debug(f'approval {rowid}')
                logger.debug(f'Old approver: {approver}')
                logger.debug(f'''New approver: {user['id']}''')
                cur.execute(
                    sql.SQL("""UPDATE approval SET "approver" = %s WHERE id = %s"""),
                    [user['id'], rowid]
                )


def extra_migrate_approval_audit_table(conn: Connection, usermap: dict, fakeusers: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("SELECT id,original,modified FROM approval_audit")
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            original = record[1]
            modified = record[2]

            # Migrate approver field from original JSON
            if (original):
                approver = original['approver']

                if (UUID_PATTERN.match(approver) is None):
                    user = check_and_create_user_if_missing(approver, usermap, fakeusers, logger)
                    logger.debug(f'approval_audit {rowid}')
                    logger.debug(f'Old original ->> approver: {approver}')
                    logger.debug(f'''New original ->> approver: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE approval_audit SET original = jsonb_set(original, {}, {}) WHERE id = %s""").format(sql.Literal('{approver}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                    )

            # Migrate approver field from modified JSON
            if (modified):
                approver = modified['approver']

                if (UUID_PATTERN.match(approver) is None):
                    user = check_and_create_user_if_missing(approver, usermap, fakeusers, logger)
                    logger.debug(f'approval_audit {rowid}')
                    logger.debug(f'Old modified ->> approver: {approver}')
                    logger.debug(f'''New modified ->> approver: {user['id']}''')
                    cur.execute(
                        sql.SQL("""UPDATE approval_audit SET modified = jsonb_set(modified, {}, {}) WHERE id = %s""").format(sql.Literal('{approver}'), sql.Literal(f'''"{user['id']}"''')),
                        [rowid]
                    )


def extra_migrate_findings_table(conn: Connection, usermap: dict, fakeusers: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL('SELECT id,"resolver" FROM findings')
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            resolver = record[1]

            if (resolver and UUID_PATTERN.match(resolver) is None):
                user = check_and_create_user_if_missing(resolver, usermap, fakeusers, logger)
                logger.debug(f'resolver {rowid}')
                logger.debug(f'Old resolver: {resolver}')
                logger.debug(f'''New resolver: {user['id']}''')
                cur.execute(
                    sql.SQL("""UPDATE findings SET "resolver" = %s WHERE id = %s"""),
                    [user['id'], rowid]
                )


# helper function for username with id replacement
def replacment_template(match, usermap, logger):
    username = match.group(1)
    if username in usermap:
        return f'@{usermap[username]["id"]}'
    return f'@{username}'


def extra_migrate_comments_table(conn: Connection, usermap: dict, logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL('SELECT id,"content" FROM comment')
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            content = record[1]

            new_content = MENTION_PATTERN.sub(lambda match: replacment_template(match, usermap, logger), content)

            if (new_content != content):
                logger.debug(f'comment mentions {rowid}')
                logger.debug(f'Old comment: {content}')
                logger.debug(f'New comment: {new_content}')
                cur.execute(
                    sql.SQL("""UPDATE comment SET "content" = %s WHERE id = %s"""),
                    [new_content, rowid]
                )


def extra_migrate_comments_audit_table(conn: Connection, usermap: dict,logger: Logger):
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("SELECT id,original,modified FROM comment_audit")
        )
        records = cur.fetchall()

        for record in records:
            rowid = record[0]
            original = record[1]
            modified = record[2]

            # Migrate content field from original JSON
            if (original):
                content = original['content']

                new_content = MENTION_PATTERN.sub(lambda match: replacment_template(match, usermap, logger), content)

                if (new_content != content):
                    logger.debug(f'comment_audit mentions {rowid}')
                    logger.debug(f'Old original ->> content: {content}')
                    logger.debug(f'New original ->> content: {new_content}')

                    cur.execute(
                        sql.SQL("""UPDATE comment_audit SET original = jsonb_set(original, {}, {}) WHERE id = %s""").format(sql.Literal('{content}'), sql.Literal(f'''{json.dumps(new_content)}''')),
                        [rowid]
                    )

            # Migrate content field from modified JSON
            if (modified):
                content = modified['content']

                new_content = MENTION_PATTERN.sub(lambda match: replacment_template(match, usermap, logger), content)

                if (new_content != content):
                    logger.debug(f'comment_audit mentions {rowid}')
                    logger.debug(f'Old modified ->> content: {content}')
                    logger.debug(f'New modified ->> content: {new_content}')

                    cur.execute(
                        sql.SQL("""UPDATE comment_audit SET modified = jsonb_set(modified, {}, {}) WHERE id = %s""").format(sql.Literal('{content}'), sql.Literal(f'''{json.dumps(new_content)}''')),
                        [rowid]
                    )


dbhost = os.environ['DB_HOST']
dbport = os.environ['DB_PORT']
dbuser = os.environ['DB_USERNAME']
dbpass = os.environ['DB_PASSWORD']
dbname = os.environ['DB_NAME']
dbssl = os.environ['DB_USE_SSL'] == 'true'

loglevel=os.environ.get('LOGLEVEL', 'DEBUG').upper()

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=loglevel)

parser = argparse.ArgumentParser(description="Migrate the tables in the database")
parser.add_argument('file', type=pathlib.Path, help="The file containing the user data")
args = parser.parse_args()

file = args.file

with open(file) as f:
    users = json.load(f)

usermap = {}
fakeusers = {}

for user in users:
    id = user.get("id")
    username = user.get("username")
    email = user.get("email")

    displayNames = user.get('attributes', {}).get('display_name', [])
    displayName = displayNames[0] if len(displayNames) else None

    clean = {
        'id': id,
        'username': username,
        'email': email or f'{id}@actor.invalid',
        'displayName': displayName or f'{username}'
    }

    usermap[username] = clean

system_actor = {
    'id': '00000000-0000-0000-0000-000000000000',
    'username': 'SYSTEM_ACTOR',
    'email': 'system@actor.invalid',
    'displayName': 'Sytem actor (machine user)'
}

usermap[system_actor['username']] = system_actor
usermap['system'] = system_actor
usermap['Yaku'] = system_actor
usermap['Aqua'] = system_actor

logger.info(f'Retrieved {len(users)} users')

audit_tables = ['approval_audit', 'comment_audit', 'long_running_token_audit', 'override_audit', 'release_audit', 'run_audit', 'task_audit']

regular_tables = ['approval', 'comment', 'long_running_token', 'override', 'release', 'task']

validMigrationTimestamp = 1725353720260

with psycopg.connect(f'host={dbhost} port={dbport} dbname={dbname} user={dbuser} password={dbpass} requiressl={int(dbssl)}') as conn:
    with conn.cursor() as cur:
        cur.execute("select timestamp from history order by timestamp desc limit 1")
        migrationTimeStamp = cur.fetchall()[0][0]

        if migrationTimeStamp != validMigrationTimestamp:
            logger.error(f'Latest migration must be: {validMigrationTimestamp}, but is: {migrationTimeStamp}. Aborting')
            sys.exit()

    for table_name in audit_tables:
        logger.info(table_name)
        migrate_audit_table(conn, table_name, usermap, fakeusers, logger)

    for table_name in regular_tables:
        logger.info(table_name)
        migrate_regular_table(conn, table_name, usermap, fakeusers, logger)

    logger.info('extra approval')
    extra_migrate_approval_table(conn, usermap, fakeusers, logger)

    logger.info('extra approval_audit')
    extra_migrate_approval_audit_table(conn, usermap, fakeusers, logger)

    logger.info('extra findings')
    extra_migrate_findings_table(conn, usermap, fakeusers, logger)

    logger.info('extra comment')
    extra_migrate_comments_table(conn, usermap, logger)

    logger.info('extra comment audit')
    extra_migrate_comments_audit_table(conn, usermap, logger)

    logger.info(f'Created {len(fakeusers)} fake users')
    for user in fakeusers:
        logger.info(json.dumps(fakeusers[user]))
    # Persist the changes
    conn.commit()

    logger.info('SUCCESS')
