#!/usr/bin/env python3

import subprocess
import json
import sys
import argparse
import pathlib
import uuid

parser = argparse.ArgumentParser(description="Check the preconditions of the users.json")
parser.add_argument('file', type=pathlib.Path, help="The file containing the user data")
args = parser.parse_args()

file = args.file

with open(file) as f:
    users = json.load(f)

print(f'Retrieved {len(users)} users', file=sys.stderr)

broken = []

for user in users:
    enabled = user.get("enabled")

    id = user.get("id")

    if (id == None):
        broken.append(("", "no id", enabled))
        continue

    try:
        uuid_obj = uuid.UUID(id, version=4)
    except ValueError:
        broken.append((id, 'Id is not a UUID', enabled))

    username = user.get("username")

    if (username == None):
        broken.append((id, "no username", enabled))

    localName = username or id

    email = user.get("email")

    if (email == None):
        broken.append((localName, "no email", enabled))

    attributes = user.get("attributes")
    if (attributes != None):
        display_names = attributes.get("display_name")

        if (display_names == None):
            broken.append((localName, "no display_name", enabled))
            continue

        if not isinstance(display_names, list):
            broken.append((localName, "display_name is not a list", enabled))
            continue

        if (len(display_names) == 1):
            display_name = display_names[0]
        else:
            broken.append((localName, "Zero or more than one display names", enabled))
            continue
    else:
        broken.append((localName, "no attributes / display_name", enabled))

for elem in broken:
    print(f'Broken:  {str(elem[0]).ljust(20)} Reason: {str(elem[1]).ljust(30)} Enabled: {str(elem[2]).ljust(40)}')

