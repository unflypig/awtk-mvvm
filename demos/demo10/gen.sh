cp ../demo6/temperature.h .
cp ../demo6/temperature.c .
rm -f *view_model.*

node ../../../awtk/tools/idl_gen/index.js idl.json .
node ../../tools/gen_vm.js idl.json

