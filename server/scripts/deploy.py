from shutil import copyfile, rmtree
import os
import sys
from subprocess import Popen, PIPE, STDOUT

deployFlag = sys.argv[1]

if deployFlag=='a':
    dirname = 'portfolio_a'
    otherDirname = 'portfolio_b'
elif deployFlag=='b':
    dirname = 'portfolio_b'
    otherDirname = 'portfolio_a'
else:
    sys.exit()

cmdDir = os.path.join(os.getcwd(), "portfolio_"+deployFlag)

cmds = [
         "npm install",
         "webpack",
         "gulp sass"
       ]

logString = ""
for fullCmd in cmds:
    logString += "\n\n"
    logString += fullCmd
    logString += "\n-----------------------------------\n"

    cmd = fullCmd.split()
    p = Popen(cmd, stdout=PIPE, stderr=STDOUT, bufsize=1, cwd=cmdDir)
    with p.stdout:
        for line in iter(p.stdout.readline, b''):
            print line,  #NOTE: the comma prevents duplicate newlines (softspace hack)
            logString += line
    p.wait()

logfile = open("log.txt", "w")
logfile.write(logString)
logfile.close()

response = raw_input("Continue? (y)")
if response!='y':
   sys.exit()

logString = ""
logString += "\n\n"
logString += "stopping other server"
logString += "\n-----------------------------------\n"

cmds = [
         "forever stop " + os.path.join(os.getcwd(),otherDirname,'server/server.js')
       ]

for fullCmd in cmds:
    logString += "\n\n"
    logString += fullCmd
    logString += "\n-----------------------------------\n"

    cmd = fullCmd.split()
    p = Popen(cmd, stdout=PIPE, stderr=STDOUT, bufsize=1)
    with p.stdout:
        for line in iter(p.stdout.readline, b''):
            print line,
            logString += line
    p.wait()

logfile = open("log.txt", "a")
logfile.write(logString)


rmtree(os.path.join(os.getcwd(),otherDirname))

cmds = [
         "forever start -o outTest.log -e errTest.log " + os.path.join(os.getcwd(),dirname,'server/server.js 3000')
       ]

for fullCmd in cmds:
    logString += "\n\n"
    logString += fullCmd
    logString += "\n-----------------------------------\n"

    cmd = fullCmd.split()
    p = Popen(cmd, stdout=PIPE, stderr=STDOUT, bufsize=1)
    with p.stdout:
        for line in iter(p.stdout.readline, b''):
            print line,
            logString += line
    p.wait()
