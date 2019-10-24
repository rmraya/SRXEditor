#!/bin/sh

cd "$(dirname "$0")/"

CLASSPATH="lib/srxeditor.jar:lib/mapdb.jar:lib/openxliff.jar:lib/dtd.jar:lib/json.jar:lib/jsoup-1.11.3,jar:lib/gtk64/swt.jar""

java  -cp ${CLASSPATH} com.maxprograms.srxeditor.SRXEditor &