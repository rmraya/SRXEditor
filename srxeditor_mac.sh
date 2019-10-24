#!/bin/sh

cd "$(dirname "$0")/"

OPTIONS=" -Xmx1500m -Xdock:name=SRXEditor -XstartOnFirstThread "
CLASSPATH="lib/srxeditor.jar:lib/mapdb.jar:lib/openxliff.jar:lib/mac64/swt.jar"

java ${OPTIONS} -cp ${CLASSPATH} com.maxprograms.srxeditor.SRXEditor &