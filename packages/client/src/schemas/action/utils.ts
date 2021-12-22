import { uid } from '@formily/shared';

export function generateDefaultFooterSchema(type?: string) {
  const schema = {
    submit: {
      key: uid(),
      name: 'submit',
      type: 'void',
      title: '提交',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'submit',
      },
      'x-designable-bar': 'Action.DesignableBar',
      'x-component': 'Action',
      'x-index': 1,
      'x-component-props': {
        title: '提交',
        type: 'primary',
        useAction: '{{submitHandler}}',
      },
    },
    cancel: {
      key: uid(),
      name: 'cancel',
      type: 'void',
      title: '取消',
      'x-align': 'right',
      'x-decorator': 'AddNew.Displayed',
      'x-decorator-props': {
        displayName: 'cancel',
      },
      'x-designable-bar': 'Action.DesignableBar',
      'x-component': 'Action',
      'x-index': 2,
      'x-component-props': {
        title: '取消',
        useAction: '{{cancelHandler}}',
      },
    },
  };
  if (schema[type]) {
    return {
      type: 'void',
      name: uid(),
      properties: {
        [type]: schema[type],
      },
    };
  }

  return {
    type: 'void',
    name: uid(),
    'x-component': 'Action.Drawer.Footer',
    properties: {
      [uid()]: {
        type: 'void',
        name: uid(),
        'x-component': 'Action.Bar',
        'x-component-props': {
          actions: [
            { title: '提交', name: 'submit' },
            { title: '取消', name: 'cancel' },
          ],
        },
        properties: {
          ...schema,
        },
      },
    },
  };
}
