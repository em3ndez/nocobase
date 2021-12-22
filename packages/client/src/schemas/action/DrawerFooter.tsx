/*
 * @Author: Semmy Wong
 * @Date: 2021-12-21 16:08:30
 * @LastEditors: Semmy Wong
 * @LastEditTime: 2021-12-22 09:03:42
 * @Description: 描述
 */
import React, { useContext } from 'react';
import { useForm, observer, useFieldSchema, RecursionField, useField } from '@formily/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, Space, Drawer as AntdDrawer } from 'antd';
import { FormLayout } from '@formily/antd';
import { useDesignable, useDefaultAction, useSchemaPath } from '..';
import { VisibleContext } from '../../context';
import { useCompile } from '../../hooks/useCompile';
import { TitleDesignableBar } from './TitleDesignableBar';
import { useDesignableSwitchContext } from '../../constate';
import { ActionBar } from './ActionBar';

export const DrawerFooter = observer(() => {
  const field = useField();
  const schema = useFieldSchema();
  console.log('===============DrawerFooter', schema.toJSON());
  return <RecursionField schema={schema} onlyRenderProperties />;
});
