const fs = require('fs')
const path = require('path')
const CodeGen = require('./code_gen');

class ViewModelGen extends CodeGen {
  genHeader(json) {
    const desc = json.desc || "";
    const clsName = this.toClassName(json.name);
    const uclsName = clsName.toUpperCase();

    let result = `
/*This file is generated by code generator*/

#include "${clsName}.h"
#include "mvvm/base/view_model.h"

#ifndef TK_${uclsName}_VIEW_MODEL_H
#define TK_${uclsName}_VIEW_MODEL_H

BEGIN_C_DECLS
/**
 * @class ${clsName}_view_model_t
 *
 * view model of ${clsName}
 *
 */
typedef struct _${clsName}_view_model_t {
  view_model_t view_model;

  /*model object*/
  ${clsName}_t* ${clsName};
} ${clsName}_view_model_t;

/**
 * @method ${clsName}_view_model_create
 * 创建${clsName} view model对象。
 *
 * @annotation ["constructor"]
 * @param {navigator_request_t*} req 请求参数。
 *
 * @return {view_model_t} 返回view_model_t对象。
 */
view_model_t* ${clsName}_view_model_create(navigator_request_t* req);

END_C_DECLS

#endif /*TK_${uclsName}_VIEW_MODEL_H*/
`

    return result;
  }

  genSetProp(json, prop) {
    let result = ''; 
    const clsName = this.toClassName(json.name);
    let value = this.genFromValue(prop.type, prop.name);

    if (this.hasSetterFor(json, prop.name)) {
      result += `${clsName}_set_${prop.name}(${clsName}, ${value});\n`
    } else if (this.isWritable(prop)) {
      if(prop.type.indexOf('char*') >= 0) {
        result += `${clsName}->${prop.name} = tk_str_copy(${clsName}->${prop.name}, ${value});\n`
      } else if(prop.type === 'str_t') {
        result += `str_set(&(${clsName}->${prop.name}), ${value});\n`

      } else {
        result += `${clsName}->${prop.name} = ${value};\n`
      }
    } else {
      result = '';
    }

    return result;
  }

  genSetPropDispatch(json) {
    const clsName = this.toClassName(json.name);
    const props = json.props || json.properties || [];
    let result = props.map((iter, index) => {
      let setProp = '';
      if (index) {
        setProp = `\n  } else if (tk_str_eq("${iter.name}", name)) {\n`
      } else {
        setProp = `  if (tk_str_eq("${iter.name}", name)) {\n`
      }
      setProp += `     ${this.genSetProp(json, iter)}\n`;
      setProp += '     return RET_OK;';
      return setProp;
    }).join('');

    result += '\n  }';

    return result;
  }

  genCanExec(json, cmd) {
    const clsName = this.toClassName(json.name);
    const cmdName = cmd.name.replace(`${clsName}_`, '');
    const name = `${clsName}_can_${cmdName}`;
 
    cmd = this.findMethod(json, name);
    if(cmd) {
      if(cmd.params.length == 1) {
        return `${name}(${clsName});`;
      } else if(cmd.params.length == 2) {
        let type = cmd.params[1].type;
        let args = this.genCmdArg(type);
        return `${name}(${clsName}, ${args});`;
      } else {
        return 'TRUE;';
      }
    } else {
      return 'TRUE;';
    }
  }

  genCanExecDispatch(json) {
    const clsName = this.toClassName(json.name);
    let commands = json.commands || json.methods || [];
    commands = commands.filter(iter => this.isCommand(iter));

    if(commands.length > 0) {
      let result =` 
  ${clsName}_view_model_t* vm = (${clsName}_view_model_t*)(obj);
  ${clsName}_t* ${clsName} = vm->${clsName};
`;

      result += commands.map((iter, index) => {
        let exec = '';
        const cmdName = iter.name.replace(`${clsName}_`, '');

        if (index) {
          exec = `\n  } else if (tk_str_eq("${cmdName}", name)) {\n`
        } else {
          exec = `  if (tk_str_eq("${cmdName}", name)) {\n`
        }
        exec += `    return ${this.genCanExec(json, iter)}\n`;
        return exec;
      }).join('');

      result += '  }';

      return result;
    } else {
      return '';
    }
  }

  genCmdArg(type) {
    let args = 'args'
    if(type.indexOf('int') >= 0) {
      args = 'tk_atoi(args)';
    } else if(type.indexOf('float') >= 0) {
      args = 'tk_atof(args)';
    } else if(type.indexOf('bool') >= 0) {
      args = 'tk_atob(args)';
    }

    return args;
  }

  genExec(json, cmd) {
    const clsName = this.toClassName(json.name);
    if(cmd.params.length == 1) {
      return `${cmd.name}(${clsName});`;
    } else if(cmd.params.length == 2) {
      let type = cmd.params[1].type;
      let args = this.genCmdArg(type);
      return `${cmd.name}(${clsName}, ${args});`;
    } else {
      return 'RET_FAIL;';
    }
  }

  genExecDispatch(json) {
    const clsName = this.toClassName(json.name);
    let commands = json.commands || json.methods || [];
    commands = commands.filter(iter => this.isCommand(iter));

    if(commands.length > 0) {
      let result =` 
  ${clsName}_view_model_t* vm = (${clsName}_view_model_t*)(obj);
  ${clsName}_t* ${clsName} = vm->${clsName};
`;
      result += commands.map((iter, index) => {
        let exec = '';
        const cmdName = iter.name.replace(`${clsName}_`, '');

        if (index) {
          exec = `\n  } else if (tk_str_eq("${cmdName}", name)) {\n`
        } else {
          exec = `  if (tk_str_eq("${cmdName}", name)) {\n`
        }
        exec += `    ${this.genExec(json, iter)}\n`;
        exec += `    return RET_OBJECT_CHANGED;\n`;
        return exec;
      }).join('');

      result += '  }';

      return result;
    } else {
      return '';
    }
  }

  genGetProp(json, prop) {
    let value = '';
    const clsName = this.toClassName(json.name);

    if (this.hasGetterFor(json, prop.name)) {
      value = `${clsName}_get_${prop.name}(${clsName})`
    } else if (this.isReadable(prop)) {
      if(prop.type === 'str_t') {
        value = `${clsName}->${prop.name}.str`
      } else {
        value = `${clsName}->${prop.name}`
      }
    } else {
      return '';
    }

    return this.genToValue(prop.type, value);
  }

  genGetPropDispatch(json) {
    const clsName = this.toClassName(json.name);
    const props = json.props || json.properties || [];

    let result = props.map((iter, index) => {
      let getProp = '';
      if (index) {
        getProp = `\n  } else if (tk_str_eq("${iter.name}", name)) {\n`
      } else {
        getProp = `  if (tk_str_eq("${iter.name}", name)) {\n`
      }
      getProp += `     ${this.genGetProp(json, iter)}\n`;
      getProp += '     return RET_OK;';
      return getProp;
    }).join('');

    result += '\n  }';

    return result;
  }

  genConstructor(json) {
    let clsName = this.toClassName(json.name);

    if (this.hasSingleton(json)) {
      return `${clsName}()`;
    } else if (this.hasCreate(json)) {
      const name = `${clsName}_create`;
      const info = this.findMethod(json, name);
      if(info.params.length === 1) {
        return `${name}(req)`;
      } else {
        return `${name}()`;
      }
    } else {
      return `TKMEM_ZALLOC(${clsName}_t)`;
    }
  }

  genDestructor(json) {
    const clsName = this.toClassName(json.name);

    if (this.hasSingleton(json)) {
      return `TK_SET_NULL`;
    } else if (this.hasCreate(json)) {
      return `${clsName}_destroy`;
    } else {
      return `TKMEM_FREE`;
    }
  }

  genContent(json) {
    const desc = json.desc || "";
    const clsName = this.toClassName(json.name);
    const uclsName = clsName.toUpperCase();
    const setPropsDispatch = this.genSetPropDispatch(json);
    const getPropsDispatch = this.genGetPropDispatch(json);
    const canExecDispatch = this.genCanExecDispatch(json);
    const execDispatch = this.genExecDispatch(json);
    const constructor = this.genConstructor(json);
    const destructor = this.genDestructor(json);

    let result = `
/*This file is generated by code generator*/

#include "tkc/mem.h"
#include "tkc/utils.h"
#include "mvvm/base/utils.h"
#include "${clsName}_view_model.h"

static ret_t ${clsName}_view_model_set_prop(object_t* obj, const char* name, const value_t* v) {
  ${clsName}_view_model_t* vm = (${clsName}_view_model_t*)(obj);
  ${clsName}_t* ${clsName} = vm->${clsName};

${setPropsDispatch}
  
  return RET_NOT_FOUND;
}


static ret_t ${clsName}_view_model_get_prop(object_t* obj, const char* name, value_t* v) {
  ${clsName}_view_model_t* vm = (${clsName}_view_model_t*)(obj);
  ${clsName}_t* ${clsName} = vm->${clsName};

${getPropsDispatch}

  return RET_NOT_FOUND;
}


static bool_t ${clsName}_view_model_can_exec(object_t* obj, const char* name, const char* args) {
${canExecDispatch}
  return FALSE;
}

static ret_t ${clsName}_view_model_exec(object_t* obj, const char* name, const char* args) {
${execDispatch}
  return RET_NOT_FOUND;
}

static ret_t ${clsName}_view_model_on_destroy(object_t* obj) {
  ${clsName}_view_model_t* vm = (${clsName}_view_model_t*)(obj);
  return_value_if_fail(vm != NULL, RET_BAD_PARAMS);

  ${destructor}(vm->${clsName});

  return view_model_deinit(VIEW_MODEL(obj));
}

static const object_vtable_t s_${clsName}_view_model_vtable = {
  .type = "${clsName}_view_model_t",
  .desc = "${clsName}_view_model_t",
  .size = sizeof(${clsName}_view_model_t),
  .exec = ${clsName}_view_model_exec,
  .can_exec = ${clsName}_view_model_can_exec,
  .get_prop = ${clsName}_view_model_get_prop,
  .set_prop = ${clsName}_view_model_set_prop,
  .on_destroy = ${clsName}_view_model_on_destroy
};

view_model_t* ${clsName}_view_model_create(navigator_request_t* req) {
  object_t* obj = object_create(&s_${clsName}_view_model_vtable);
  view_model_t* vm = view_model_init(VIEW_MODEL(obj));
  ${clsName}_view_model_t* ${clsName}_view_model = (${clsName}_view_model_t*)(vm);

  return_value_if_fail(vm != NULL, NULL);

  ${clsName}_view_model->${clsName} = ${constructor};
  ENSURE(${clsName}_view_model->${clsName} != NULL);

  return vm;
}
`;

    return result;
  }

  genFile(filename) {
    this.genJson(JSON.parse(fs.readFileSync(filename).toString()));
  }

  static run(filename) {
    const gen = new ViewModelGen();
    gen.genFile(filename);
  }
}

if (process.argv.length < 3) {
  console.log(`Usage: node index.js idl.json`);
  process.exit(0);
}

ViewModelGen.run(process.argv[2]);
