﻿/**
 * File:   temperature.h
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
 * 2019-02-02 Li XianJing <xianjimli@hotmail.com> created
 *
 */

#ifndef TK_TEMPERATURE_H
#define TK_TEMPERATURE_H

#include "mvvm/base/model.h"

BEGIN_C_DECLS

/**
 * @class temperature_t
 *
 * 温度对象。
 *
 */
typedef struct _temperature_t {
  model_t model;

  double value;
} temperature_t;

/**
 * @method temperature_create
 * 创建temperature对象。
 *
 * @annotation ["constructor"]
 * @param {void*} args 参数(目前没有，仅仅为了于model_create_t保持一致)
 *
 * @return {model_t} 返回model_t对象。
 */
model_t* temperature_create(void* args);

#define TEMPERATURE(t) ((temperature_t*)(t))

END_C_DECLS

#endif /*TK_TEMPERATURE_H*/
