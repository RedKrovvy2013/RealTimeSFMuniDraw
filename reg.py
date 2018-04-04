import os
import re
import sys

for root, dirnames, filenames in os.walk(os.getcwd()):
    for filename in filenames:
        if '.git' in root:
            continue
        if 'node_modules' in root:
            continue
        if 'bundle' in filename:
            continue
        match = re.search(r'\.(html)|(js)|(scss)$', filename)
        if match is not None:
            newfile = ''
            filepath = os.path.join(root, filename)
            with open(filepath, 'r') as filedata:
                for line in filedata:
                    line = re.sub(sys.argv[1], sys.argv[2], line)
                    newfile += line
            with open(filepath, 'w') as file:
                file.write(newfile)
