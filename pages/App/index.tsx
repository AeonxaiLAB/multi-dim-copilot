'use client'
import { bitable, ITableMeta } from "@lark-base-open/js-sdk";
import { Button, Form } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { BaseFormApi } from '@douyinfe/semi-foundation/lib/es/form/interface';
import styles from './index.module.css';

export default function App() {
  const [tableMetaList, setTableMetaList] = useState<ITableMeta[]>();
  const formApi = useRef<BaseFormApi>();
  const addRecord = useCallback(async ({ table: tableId }: { table: string }) => {
    if (tableId) {
      const table = await bitable.base.getTableById(tableId);
      table.addRecord({
        fields: {},
      });
    }
  }, []);
  useEffect(() => {
    Promise.all([bitable.base.getTableMetaList(), bitable.base.getSelection()])
      .then(([metaList, selection]) => {
        setTableMetaList(metaList);
        formApi.current?.setValues({ table: selection.tableId });
      });
  }, []);

  return (
    <main className={styles.main}>
      <h4 className={styles.h4}>
        Edit <code className={styles.code}>src/App.tsx</code> and save to reload
      </h4>
      <Form labelPosition='top' onSubmit={addRecord} getFormApi={(baseFormApi: BaseFormApi) => formApi.current = baseFormApi}>
        <Form.Slot label="Development guide">
          <div>
            <a href="https://lark-technologies.larksuite.com/docx/HvCbdSzXNowzMmxWgXsuB2Ngs7d" target="_blank"
              rel="noopener noreferrer">
              Base Extensions Guide
            </a>
            、
            <a href="https://bytedance.feishu.cn/docx/HazFdSHH9ofRGKx8424cwzLlnZc" target="_blank"
              rel="noopener noreferrer">
              多维表格插件开发指南
            </a>
          </div>
        </Form.Slot>
        <Form.Slot label="API">
          <div>
            <a href="https://lark-technologies.larksuite.com/docx/Y6IcdywRXoTYSOxKwWvuLK09sFe" target="_blank"
              rel="noopener noreferrer">
              Base Extensions Front-end API
            </a>
            、
            <a href="https://bytedance.feishu.cn/docx/HjCEd1sPzoVnxIxF3LrcKnepnUf" target="_blank"
              rel="noopener noreferrer">
              多维表格插件API
            </a>
          </div>
        </Form.Slot>
        <Form.Select field='table' label='Select Table' placeholder="Please select a Table" style={{ width: '100%' }}>
          {
            Array.isArray(tableMetaList) && tableMetaList.map(({ name, id }) => {
              return (
                <Form.Select.Option key={id} value={id}>
                  {name}
                </Form.Select.Option>
              );
            })
          }
        </Form.Select>
        <Button theme='solid' htmlType='submit'>Add Record</Button>
      </Form>
    </main>
  )
}