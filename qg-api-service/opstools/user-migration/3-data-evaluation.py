#!/usr/bin/env python3

# based on 2-data-migration.py write a script that evaluates the data migration (checking wether all actors have been migrated, and if the data is consistent)


import argparse
import json
import logging
import os
import pathlib
import re
import sys
from logging import Logger

import psycopg
from psycopg import Connection, sql

UUID_PATTERN = re.compile(
    "^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
MENTION_PATTERN = re.compile("@(\S+)")


def initialize_usermap(users: list, logger: Logger) -> dict:
    usermap = {}
    error_in_user_data = False
    for user in users:
        usermap[user["id"]] = user
        # unfold display_name and fill in missing attributes
        if "username" not in user:
            logger.error("username missing in user data")
            error_in_user_data = True
        if (
            "attributes" in user
            and user["attributes"]
            and "display_name" in user["attributes"]
            and user["attributes"]["display_name"]
            and len(user["attributes"]["display_name"]) == 1
        ):
            user["display_name"] = user["attributes"]["display_name"][0]
        else:
            logger.warning(
                f"Display name for user {user['id']} is missing in user data, using username ${user['username']}"
            )
            user["display_name"] = user["username"]
        if "email" not in user:
            clean_email = f'{user["id"]}@actor.invalid'
            logger.warning(
                f"Email for user {user['id']} is missing in user data, using {clean_email}"
            )
            user["email"] = clean_email

    if error_in_user_data:
        logger.error("Errors in user data, aborting")
        sys.exit(1)

    return usermap


def check_user(user: dict, usermap: dict, logger: Logger) -> int:
    error_count = 0
    if user["id"] not in usermap:
        logger.error(f"User {user['id']} not found in user data")
        error_count += 1
        return error_count
    detected_user = usermap[user["id"]]
    if user["username"] != detected_user["username"]:
        logger.error(f"Username for user {user['id']} does not match")
        error_count += 1
    if user["email"] != detected_user["email"]:
        logger.error(f"Email for user {user['id']} does not match")
        error_count += 1
    if user["displayName"] != detected_user["display_name"]:
        logger.error(f"Display name for user {user['id']} does not match")
        error_count += 1
    return error_count


def check_audit_table(
    conn: Connection, table_name: str, usermap: dict, logger: Logger
) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL("SELECT id,actor,original,modified FROM {}").format(
                sql.Identifier(table_name)
            )
        )
        records = cur.fetchall()
        for record in records:
            id = record[0]
            actor = record[1]
            original = record[2]
            modified = record[3]

            if not UUID_PATTERN.match(actor["id"]):
                error_count += 1
                logger.error(
                    f"Actor {actor} in row with id: {id} of {table_name} is not a valid UUID"
                )
            else:
                error_count += check_user(actor, usermap, logger)

            if original and "createdBy" in original and "lastModifiedBy" in original:
                createdBy = original["createdBy"]
                lastModifiedBy = original["lastModifiedBy"]

                if not UUID_PATTERN.match(createdBy):
                    error_count += 1
                    logger.error(
                        f"createdBy {createdBy} in row with id: {id} of {table_name}.original is not a valid UUID"
                    )

                if not UUID_PATTERN.match(lastModifiedBy):
                    error_count += 1
                    logger.error(
                        f"lastModifiedBy {lastModifiedBy} row {id} of {table_name}.original is not a valid UUID"
                    )

            if modified and "createdBy" in modified and "lastModifiedBy" in modified:
                createdBy = modified["createdBy"]
                lastModifiedBy = modified["lastModifiedBy"]

                if not UUID_PATTERN.match(createdBy):
                    error_count += 1
                    logger.error(
                        f"createdBy {createdBy} row {id} of {table_name}.modified is not a valid UUID"
                    )

                if not UUID_PATTERN.match(lastModifiedBy):
                    error_count += 1
                    logger.error(
                        f"lastModifiedBy {lastModifiedBy} row {id} of {table_name}.modified is not a valid UUID"
                    )
    return error_count


def check_regular_table(conn: Connection, table_name: str, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(
            sql.SQL('SELECT id,"createdBy","lastModifiedBy" FROM {}').format(
                sql.Identifier(table_name)
            )
        )
        records = cur.fetchall()
        for record in records:
            id = record[0]
            createdBy = record[1]
            lastModifiedBy = record[2]

            if not UUID_PATTERN.match(createdBy):
                error_count += 1
                logger.error(
                    f"createdBy {createdBy} row {id} of {table_name} is not a valid UUID"
                )

            if not UUID_PATTERN.match(lastModifiedBy):
                error_count += 1
                logger.error(
                    f"lastModifiedBy {lastModifiedBy} row {id} of {table_name} is not a valid UUID"
                )
    return error_count


def check_approval_table(conn: Connection, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(sql.SQL('SELECT id,"approver" FROM approval'))
        records = cur.fetchall()

        for record in records:
            id = record[0]
            approver = record[1]

            if not UUID_PATTERN.match(approver):
                error_count += 1
                logger.error(
                    f"approver {approver} in row with id: {id} of approval is not a valid UUID"
                )
    return error_count


def check_approval_audit_table(conn: Connection, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(sql.SQL("SELECT id,original,modified FROM approval_audit"))
        records = cur.fetchall()

        for record in records:
            id = record[0]
            original = record[1]
            modified = record[2]

            if original:
                if not original["approver"]:
                    error_count += 1
                    logger.error(f"approver in approval_audit.original is missing")
                else:
                    approver = original["approver"]
                    if not UUID_PATTERN.match(approver):
                        error_count += 1
                        logger.error(
                            f"approver {approver} in row with id: {id} of approval_audit.original is not a valid UUID"
                        )

            if modified:
                if not modified["approver"]:
                    error_count += 1
                    logger.error(f"approver in approval_audit.modified is missing")
                else:
                    approver = modified["approver"]
                    if not UUID_PATTERN.match(approver):
                        error_count += 1
                        logger.error(
                            f"approver {approver} in row with id: {id} of approval_audit.modified is not a valid UUID"
                        )
    return error_count


def check_findings_table(conn: Connection, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(sql.SQL('SELECT id,"resolver" FROM findings'))
        records = cur.fetchall()

        for record in records:
            id = record[0]
            resolver = record[1]
            if not resolver:
                continue  # ignore unresolved findings
            if not UUID_PATTERN.match(resolver):
                error_count += 1
                logger.error(
                    f"resolver {resolver} in row with id: {id} of findings is not a valid UUID"
                )
    return error_count


def check_comments_table(conn: Connection, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(sql.SQL('SELECT id,"content" FROM comment'))
        records = cur.fetchall()
        for record in records:
            last_error_count = error_count
            id = record[0]
            content = record[1]

            possible_mentions = MENTION_PATTERN.findall(content)

            for mention in possible_mentions:
                if not UUID_PATTERN.match(mention):
                    error_count += 1
            if last_error_count != error_count:
                logger.error(
                    f"mentions in row with id: {id} of comment may not be valid UUIDs: {content}"
                )
    return error_count


def check_comment_audit_table(conn: Connection, logger: Logger) -> int:
    error_count = 0
    with conn.cursor() as cur:
        cur.execute(sql.SQL("SELECT id,original,modified FROM comment_audit"))
        records = cur.fetchall()

        for record in records:
            id = record[0]
            original = record[1]
            modified = record[2]

            if original:
                content = original["content"]
                possible_mentions = MENTION_PATTERN.findall(content)

                last_error_count = error_count

                for mention in possible_mentions:
                    if not UUID_PATTERN.match(mention):
                        error_count += 1

                if last_error_count != error_count:
                    logger.error(
                        f"mentions in row with id: {id} of comment_audit.original may not be valid UUIDs: {content}"
                    )

            if modified:
                content = modified["content"]
                possible_mentions = MENTION_PATTERN.findall(content)

                last_error_count = error_count

                for mention in possible_mentions:
                    if not UUID_PATTERN.match(mention):
                        error_count += 1
                
                if last_error_count != error_count:
                    logger.error(
                        f"mentions in row with id: {id} of comment_audit.modified may not be valid UUIDs: {content}"
                    )
    return error_count


dbhost = os.environ["DB_HOST"]
dbport = os.environ["DB_PORT"]
dbuser = os.environ["DB_USERNAME"]
dbpass = os.environ["DB_PASSWORD"]
dbname = os.environ["DB_NAME"]
dbssl = os.environ["DB_USE_SSL"] == "true"

loglevel = os.environ.get("LOGLEVEL", "DEBUG").upper()

logger = logging.getLogger(__name__)
logging.basicConfig(stream=sys.stdout, level=loglevel)

audit_tables = [
    "approval_audit",
    "comment_audit",
    "long_running_token_audit",
    "override_audit",
    "release_audit",
    "run_audit",
    "task_audit",
]

regular_tables = [
    "approval",
    "comment",
    "long_running_token",
    "override",
    "release",
    "task",
]

validMigrationTimestamp = 1725353720260

parser = argparse.ArgumentParser(description="Migrate the tables in the database")
parser.add_argument("file", type=pathlib.Path, help="The file containing the user data")
args = parser.parse_args()

file = args.file

with open(file) as f:
    users = json.load(f)

usermap = initialize_usermap(users, logger)

system_actor = {
    "id": "00000000-0000-0000-0000-000000000000",
    "username": "SYSTEM_ACTOR",
    "email": "system@actor.invalid",
    "display_name": "Sytem actor (machine user)",
}

usermap[system_actor["id"]] = system_actor

with psycopg.connect(
    f"host={dbhost} port={dbport} dbname={dbname} user={dbuser} password={dbpass} requiressl={int(dbssl)}"
) as conn:
    with conn.cursor() as cur:
        cur.execute("select timestamp from history order by timestamp desc limit 1")
        migrationTimeStamp = cur.fetchall()[0][0]

        if migrationTimeStamp != validMigrationTimestamp:
            logger.error(
                f"Latest migration must be: {validMigrationTimestamp}, but is: {migrationTimeStamp}. Aborting"
            )
            sys.exit()

    accumulated_errors = 0
    for table_name in audit_tables:
        logger.info(table_name)
        errors = check_audit_table(conn, table_name, usermap, logger)
        if errors > 0:
            logger.error(f"{errors} errors found in {table_name}")
        accumulated_errors += errors

    for table_name in regular_tables:
        logger.info(table_name)
        errors = check_regular_table(conn, table_name, logger)
        if errors > 0:
            logger.error(f"{errors} errors found in {table_name}")
        accumulated_errors += errors

    logger.info("approval")
    approval_table_errors = check_approval_table(conn, logger)
    if approval_table_errors > 0:
        logger.error(f"{approval_table_errors} errors found in approval")
    accumulated_errors += approval_table_errors

    logger.info("approval_audit")
    approval_audit_table_errors = check_approval_audit_table(conn, logger)
    if approval_audit_table_errors > 0:
        logger.error(f"{approval_audit_table_errors} errors found in approval_audit")
    accumulated_errors += approval_audit_table_errors

    logger.info("findings")
    findings_table_errors = check_findings_table(conn, logger)
    if findings_table_errors > 0:
        logger.error(f"{findings_table_errors} errors found in findings")
    accumulated_errors += findings_table_errors

    logger.info("comment")
    comment_table_errors = check_comments_table(conn, logger)
    if comment_table_errors > 0:
        logger.error(f"{comment_table_errors} errors found in comment")
    accumulated_errors += comment_table_errors

    logger.info("comment_audit")
    comment_audit_table_errors = check_comment_audit_table(conn, logger)
    if comment_audit_table_errors > 0:
        logger.error(f"{comment_audit_table_errors} errors found in comment_audit")
    accumulated_errors += comment_audit_table_errors

    logger.info("Data migration evaluation completed")
    if accumulated_errors > 0:
        logger.error(f"{accumulated_errors} errors found in total")
        logger.info("Please check the logs for more information")
        sys.exit(1)
    else:
        logger.info("No errors found")
        sys.exit(0)
