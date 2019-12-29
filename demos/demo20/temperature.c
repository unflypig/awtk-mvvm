﻿/**
 * File:   temperature.c
 * Author: AWTK Develop Team
 * Brief:  temperature
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
 * 2019-12-29 Li XianJing <xianjimli@hotmail.com> created
 *
 */

#include "awtk.h"
#include "tkc/event_source_fd.h"
#include "streams/serial/iostream_serial.h"
#include "../common/temperature.h"

#include "temperature.h"

#define PROP_TEMP "value"
#define SERIAL_PORT "/dev/pts/1"

static ret_t event_source_serial_on_data(event_source_t* source) {
  char str[128];
  int temp = 0;
  event_source_fd_t* s = EVENT_SOURCE_FD(source);

  object_t* view_model = OBJECT(s->ctx);
  tk_iostream_t* iostream = TK_IOSTREAM(s->ctx2);

  memset(str, 0x00, sizeof(str));
  int ret = tk_iostream_read(iostream, str, sizeof(str));

  if (ret > 0) {
    temp = tk_atoi(str);
    object_set_prop_int(view_model, PROP_TEMP, temp);
    log_debug("get data:%s\n", str);
  } else {
    log_debug("not data\n");
  }

  return RET_OK;
}

static ret_t main_loop_add_stream_source(tk_iostream_t* iostream, void* ctx) {
  int fd = 0;
  event_source_t* source = NULL;
  return_value_if_fail(iostream != NULL, RET_BAD_PARAMS);

  fd = object_get_prop_int(OBJECT(iostream), TK_STREAM_PROP_FD, 0);
  source = event_source_fd_create(fd, event_source_serial_on_data, ctx);
  return_value_if_fail(source != NULL, RET_OOM);
  EVENT_SOURCE_FD(source)->ctx2 = iostream;

  return main_loop_add_event_source(main_loop(), source);
}

view_model_t* temperature_view_model_timer_create(navigator_request_t* req) {
  view_model_t* view_model = temperature_view_model_create(req);

  main_loop_add_stream_source(tk_iostream_serial_create(SERIAL_PORT), view_model);

  return view_model;
}
