/*
 * @Author: Semmy Wong
 * @Date: 2021-12-10 15:54:39
 * @LastEditors: Semmy Wong
 * @LastEditTime: 2021-12-22 10:53:08
 * @Description: 描述
 */
import React, { useContext } from 'react';
import {
  useForm,
  observer,
  useFieldSchema,
  Schema,
  RecursionField,
  SchemaExpressionScopeContext,
} from '@formily/react';
import { uid } from '@formily/shared';
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
import { DrawerFooter } from './DrawerFooter';
import { generateDefaultFooterSchema } from './utils';

export const Drawer: any = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { useOkAction = useDefaultAction, useCancelAction = useDefaultAction, ...others } = props;
  const { schema, appendChild } = useDesignable();
  const fieldSchema = useFieldSchema();
  let fs = new Schema(generateDefaultFooterSchema() as any);
  fieldSchema.addProperty(uid(), fs);
  // fs = appendChild(fs);
  console.log('===========fieldSchema', fieldSchema, fieldSchema.toJSON());
  const [visible, setVisible] = useContext(VisibleContext);
  const { designable, setDesignable } = useDesignableSwitchContext();
  const form = useForm();
  const { run: runOk } = useOkAction();
  const { run: runCancel } = useCancelAction();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  console.log('Action.Modal.field', schema['x-read-pretty']);
  return (
    <>
      {createPortal(
        <AntdDrawer
          width={'50%'}
          title={
            <>
              {compile(schema.title)}
              {<TitleDesignableBar />}
            </>
          }
          maskClosable
          destroyOnClose
          footer={
            isFormDecorator &&
            !schema['x-read-pretty'] && (
              <>
                {/* <ActionBar></ActionBar> */}
                <SchemaExpressionScopeContext.Provider
                  value={{
                    cancelHandler() {
                      return {
                        async run(e) {
                          form.clearErrors();
                          debugger;
                          props.onClose && (await props.onClose(e));
                          runCancel && (await runCancel());
                          setVisible(false);
                          if (isFormDecorator) {
                            await form.reset();
                          }
                        },
                      };
                    },
                    submitHandler() {
                      return {
                        async run(e) {
                          await form.submit();
                          debugger;
                          props.onOk && (await props.onOk(e));
                          runOk && (await runOk());
                          setVisible(false);
                          if (isFormDecorator) {
                            await form.reset();
                          }
                        },
                      };
                    },
                  }}
                >
                  <RecursionField
                    schema={fieldSchema}
                    onlyRenderProperties
                    filterProperties={(s) => s['x-component'] === 'Action.Drawer.Footer'}
                  />
                </SchemaExpressionScopeContext.Provider>
              </>
            )
          }
          {...others}
          visible={visible}
          onClose={async (e) => {
            props.onClose && (await props.onClose(e));
            runCancel && (await runCancel());
            setVisible(false);
            if (isFormDecorator) {
              await form.reset();
            }
          }}
        >
          <FormLayout layout={'vertical'}>
            {/* {props.children} */}
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] !== 'Action.Drawer.Footer'}
            />
          </FormLayout>
        </AntdDrawer>,
        document.body,
      )}
    </>
  );
});

Drawer.Footer = DrawerFooter;
