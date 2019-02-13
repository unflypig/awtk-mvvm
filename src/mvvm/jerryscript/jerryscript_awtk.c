﻿/**
 * File:   jerryscript_awtk.c
 * Author: AWTK Develop Team
 * Brief:  awtk for jerryscript
 *
 * Copyright (c) 2019 - 2019  Guangzhou ZHIYUAN Electronics Co.,Ltd.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * License file for more details.
 *
 */

/**
 * History:
 * ================================================================
 * 2019-02-13 Li XianJing <xianjimli@hotmail.com> created
 *
 */

#include "jerryscript.h"
#include "jerryscript-ext/handler.h"

#include "base/idle.h"
#include "base/timer.h"
#include "src/awtk_global.h"
#include "mvvm/jerryscript/jsobj.h"
#include "mvvm/jerryscript/jerryscript_awtk.h"

static ret_t ret_t_init(void) {
  jerry_value_t obj = jerry_get_global_object();

  jsobj_set_prop_int(obj, "RET_OK", RET_OK);
  jsobj_set_prop_int(obj, "RET_OOM", RET_OOM);
  jsobj_set_prop_int(obj, "RET_FAIL", RET_FAIL);
  jsobj_set_prop_int(obj, "RET_NOT_IMPL", RET_NOT_IMPL);
  jsobj_set_prop_int(obj, "RET_QUIT", RET_QUIT);
  jsobj_set_prop_int(obj, "RET_FOUND", RET_FOUND);
  jsobj_set_prop_int(obj, "RET_BUSY", RET_BUSY);
  jsobj_set_prop_int(obj, "RET_REMOVE", RET_REMOVE);
  jsobj_set_prop_int(obj, "RET_REPEAT", RET_REPEAT);
  jsobj_set_prop_int(obj, "RET_NOT_FOUND", RET_NOT_FOUND);
  jsobj_set_prop_int(obj, "RET_DONE", RET_DONE);
  jsobj_set_prop_int(obj, "RET_STOP", RET_STOP);
  jsobj_set_prop_int(obj, "RET_CONTINUE", RET_CONTINUE);
  jsobj_set_prop_int(obj, "RET_BAD_PARAMS", RET_BAD_PARAMS);

  jerry_release_value(obj);

  return RET_OK;
}

static ret_t timer_info_on_destroy(void* data) {
  timer_info_t* item = (timer_info_t*)data;

  uint32_t func = (char*)(item->ctx) - (char*)NULL;
  jerry_release_value(func);

  return RET_OK;
}

static ret_t call_on_timer(const timer_info_t* timer) {
  jerry_value_t res;
  jerry_value_t args[1];
  jerry_value_t this_value = jerry_create_undefined();
  jerry_value_t func = (jerry_value_t)((char*)timer->ctx - (char*)NULL);

  args[0] = jerry_create_undefined();
  res = jerry_call_function(func, this_value, args, 1);

  jerry_release_value(args[0]);
  jerry_release_value(this_value);

  return (ret_t)jerry_get_number_value(res);
}

jerry_value_t wrap_timer_add(const jerry_value_t func_obj_val, const jerry_value_t this_p,
                             const jerry_value_t args_p[], const jerry_length_t args_cnt) {
  int32_t ret = 0;
  return_value_if_fail(args_cnt >= 2, jerry_create_undefined());

  if (args_cnt >= 2) {
    jerry_value_t on_timer = jerry_acquire_value(args_p[0]);
    uint32_t duration_ms = (uint32_t)jerry_get_number_value(args_p[1]);
    void* ctx = (char*)NULL + (int32_t)on_timer;

    ret = (uint32_t)timer_add(call_on_timer, ctx, duration_ms);
    timer_set_on_destroy(ret, timer_info_on_destroy, NULL);
  } else {
    log_warn("%s invalid args\n", __FUNCTION__);
  }

  return jerry_create_number(ret);
}

static ret_t idle_info_on_destroy(void* data) {
  idle_info_t* item = (idle_info_t*)data;

  uint32_t func = (char*)(item->ctx) - (char*)NULL;
  jerry_release_value(func);

  return RET_OK;
}

static ret_t call_on_idle(const idle_info_t* idle) {
  jerry_value_t res;
  jerry_value_t args[1];
  jerry_value_t this_value = jerry_create_undefined();
  jerry_value_t func = (jerry_value_t)((char*)idle->ctx - (char*)NULL);

  args[0] = jerry_create_undefined();
  res = jerry_call_function(func, this_value, args, 1);

  jerry_release_value(args[0]);
  jerry_release_value(this_value);

  return (ret_t)jerry_get_number_value(res);
}

jerry_value_t wrap_idle_add(const jerry_value_t func_obj_val, const jerry_value_t this_p,
                            const jerry_value_t args_p[], const jerry_length_t args_cnt) {
  int32_t ret = 0;
  return_value_if_fail(args_cnt >= 2, jerry_create_undefined());

  if (args_cnt >= 1) {
    jerry_value_t on_idle = jerry_acquire_value(args_p[0]);
    void* ctx = (char*)NULL + (int32_t)on_idle;

    ret = (uint32_t)idle_add(call_on_idle, ctx);
    idle_set_on_destroy(ret, idle_info_on_destroy, NULL);
  } else {
    log_warn("%s invalid args\n", __FUNCTION__);
  }

  return jerry_create_number(ret);
}

jerry_value_t wrap_timer_remove(const jerry_value_t func_obj_val, const jerry_value_t this_p,
                                const jerry_value_t args_p[], const jerry_length_t args_cnt) {
  ret_t ret = 0;
  uint32_t timer_id = (uint32_t)jerry_get_number_value(args_p[0]);
  ret = (ret_t)timer_remove(timer_id);

  return jerry_create_number(ret);
}

jerry_value_t wrap_idle_remove(const jerry_value_t func_obj_val, const jerry_value_t this_p,
                               const jerry_value_t args_p[], const jerry_length_t args_cnt) {
  ret_t ret = 0;
  uint32_t idle_id = (uint32_t)jerry_get_number_value(args_p[0]);
  ret = (ret_t)idle_remove(idle_id);

  return jerry_create_number(ret);
}

jerry_value_t wrap_quit(const jerry_value_t func_obj_val, const jerry_value_t this_p,
                        const jerry_value_t args_p[], const jerry_length_t args_cnt) {
  tk_quit();
  return jerry_create_number(0);
}

ret_t jerryscript_awtk_init(void) {
  ret_t_init();
  jerryx_handler_register_global((const jerry_char_t*)"exit", wrap_quit);
  jerryx_handler_register_global((const jerry_char_t*)"quit", wrap_quit);

  jerryx_handler_register_global((const jerry_char_t*)"timerAdd", wrap_timer_add);
  jerryx_handler_register_global((const jerry_char_t*)"timerRemove", wrap_timer_remove);
  jerryx_handler_register_global((const jerry_char_t*)"idleAdd", wrap_idle_add);
  jerryx_handler_register_global((const jerry_char_t*)"idleRemove", wrap_idle_remove);

  return RET_OK;
}

ret_t jerryscript_awtk_deinit(void) {
  return RET_OK;
}