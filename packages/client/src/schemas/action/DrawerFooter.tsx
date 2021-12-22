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
  return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
});
