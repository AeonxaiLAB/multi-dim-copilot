import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  bitable,
  CurrencyCode,
  FieldType,
  ICurrencyField,
  ICurrencyFieldMeta,
} from "@lark-base-open/js-sdk";
import { Alert, AlertProps, Button, Select, Slider } from "antd";

const Home = () => {
  return (
    <React.StrictMode>
      <LoadApp />
    </React.StrictMode>
  );
};

function LoadApp() {
  interface ItemWithText {
    text: string;
    // include any other properties that might be present
  }

  const [tableOptions, setTableOptions] = useState<
    { label: string; value: string }[]
  >([]); // 新增状态变量存储表选项
  const [selectTableId, setSelectTableId] = useState<string>("");
  const [fieldOptions, setFieldOptions] = useState<
    {
      label: string;
      value: string;
    }[]
  >([]);
  const [selectInputFieldId, setSelectInputFieldId] = useState<string>("");
  const [selectOutputFieldId, setSelectOutputFieldId] = useState<string>("");
  const [selectTransformType, setSelectTransformType] = useState<string>("");
  const [selectModelType, setSelectModelType] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [concurrentNum, setConcurrentNum] = useState<number>(3);
  const [finish, setFinish] = useState<boolean>(true);
  const [tips, setTips] =
    useState<string>("更改表格内容后请刷新后再点击运行！");

  const transformType = [
    { label: "自定义", value: "0" },
    { label: "多语言翻译", value: "1" },
    { label: "地址识别器", value: "2" },
    { label: "日期标准化处理", value: "3" },
    { label: "大小写转换器", value: "4" },
  ];
  const prePrompt = [
    "请输入自定义prompt，{input} 为文本输入占位符\n-----\n示例：\n你是一个好用的翻译助手，请自动识别{{原始文本}}语言，并翻译成{{目标语言}}，只需要返回翻译结果\n原始文本：\n{input} \n目标语言：日语",
    "你是一个好用的翻译助手，请自动识别{{原始文本}}语言，并翻译成{{目标语言}}，只需要返回翻译结果\n原始文本：\n{input} \n目标语言：日语",
    "请提取并标准化以下地址信息，如果遇到未提取的省份或市辖区，请用空字符串补全。地址结构为：省份、市、区（县）、具体地址。只需要返回标准化地址\n原始地址：{input}\n标准化地址：\n[省] [市] [区县] [街路][号]",
    "请将以下时间转换成标准化格式，时间结构为：年、月、日、小时、分钟、秒。只需要返回标准化时间\n如果未提取到，使用以下默认填充值：\n- 年：2024年\n- 月：1月\n- 日：1日\n- 小时：0时\n- 分钟：0分\n- 秒：0秒\n原始时间：{input}\n标准化时间格式：\n[yyyy]-[MM]-[dd] [HH]:[mm]:[ss]",
    "请将以下文本统一转换成大写，只需要返回转换后的结果\n输入文本：\n{input}",
  ];

  const modelType = [
    { label: "GLM-3-Turbo", value: "glm-3-turbo" },
    { label: "GLM-4", value: "glm-4" },
  ];

  useEffect(() => {
    //const table = await bitable.base.getActiveTable();
    // 加载仪表盘根列表数据表选项
    async function loadTableOptions() {
      const metaList = await bitable.base.getTableMetaList();
      setTableOptions(
        metaList.map((meta) => ({ label: meta.name, value: meta.id }))
      ); // 更新状态变量
      setSelectTableId(metaList[0].id); // 设置默认选中的数据表（第一个数据表）
      setSelectModelType(modelType[0].value);
    }
    loadTableOptions();
  }, []);

  useEffect(() => {
    const loadFieldOptions = async () => {
      const table = await bitable.base.getTableById(selectTableId);
      if (!table) {
        setFieldOptions([]); // 确保在没有找到表时清空字段选项
        return;
      }
      const fieldList = await table.getFieldMetaList();
      const formattedFieldOptions = fieldList.map((field) => ({
        label: field.name,
        value: field.id,
      }));
      setFieldOptions(formattedFieldOptions);
      setSelectInputFieldId(formattedFieldOptions[0].value);
      setSelectOutputFieldId(formattedFieldOptions[0].value);
    };

    if (selectTableId) {
      loadFieldOptions();
    }
  }, [selectTableId]);

  useEffect(() => {
    setPrompt(prePrompt[Number(selectTransformType)]);
  }, [selectTransformType]);

  function formatMessage(prompt: string, input: string) {
    return prompt.replace(/\{input\}/g, input);
  }

  async function handleTransform() {
    const table = await bitable.base.getTableById(selectTableId);
    if (!table) {
      console.error("Table not found");
      return;
    }

    const inputField = await table.getFieldById(selectInputFieldId);
    const outputField = await table.getFieldById(selectOutputFieldId);
    if (!inputField || !outputField) {
      console.error("Field not found");
      return;
    }

    const inputFieldValueList = await inputField.getFieldValueList();
    inputFieldValueList.map(async (item) => {
      const valueRecord_id: string = item.record_id as string;
      const valueArray: Array<ItemWithText> = item.value as Array<ItemWithText>;
      const textValue = await chat(valueArray[0].text);

      await table.setRecord(valueRecord_id, {
        fields: {
          [outputField.id]: textValue, // 直接传递字符串
        },
      });
    });
  }

  async function chat(input: string) {
    const formattedPrompt = formatMessage(prompt, input);
    const response = await fetch(
      "https://19d2e8ef-ce97-4045-842d-b4b4b3d1b8e4-00-5uuqemb468qo.janeway.replit.dev/api/server",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          num: concurrentNum,
          model: selectModelType,
          prompt: formattedPrompt,
          apiKey,
        }),
      }
    );
    //const textValue = await response.text(); // 提取字符串内容
    setTips("任务正在运行，刷新页面和更改选项会中断任务！");
    const jsonResponse = await response.json(); // 解析JSON格式响应体
    const textValue = jsonResponse.message; // 提取message字段的值
    const isFinish = jsonResponse.finish;
    setFinish(isFinish);
    if (isFinish) {
      setTips("任务完成！");
    }
    return textValue;
  }

  return (
    <div>
      {/* 万能转换助理 */}
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>请选择数据表</div>
        <Select
          style={{ width: 260 }}
          value={selectTableId}
          onSelect={setSelectTableId}
          options={tableOptions}
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>输入字段</div>
        <Select
          style={{ width: 260 }}
          value={selectInputFieldId}
          onSelect={setSelectInputFieldId}
          options={fieldOptions}
          defaultValue={
            fieldOptions.length > 0 ? fieldOptions[0].value : undefined
          }
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>输出字段</div>
        <Select
          style={{ width: 260 }}
          value={selectOutputFieldId}
          onSelect={setSelectOutputFieldId}
          options={fieldOptions}
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>转换模板</div>
        <Select
          style={{ width: 260 }}
          onSelect={setSelectTransformType}
          options={transformType}
          defaultValue={transformType[0].value}
        />
      </div>
      <div style={{ margin: 20 }}>
        <textarea
          style={{
            fontSize: 15,
            height: 150,
            width: 260,
            borderRadius: 5,
            borderColor: "#e0e5df",
          }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="输入你的prompt"
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>选择模型</div>
        <Select
          style={{ width: 260 }}
          value={selectModelType}
          onSelect={setSelectModelType}
          options={modelType}
          defaultValue={modelType[0].value}
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 20 }}>最大同时运行行数</div>
        <Slider
          style={{ width: 250 }}
          min={1}
          max={20}
          onChange={(value) => setConcurrentNum(value)}
          value={typeof concurrentNum === "number" ? concurrentNum : 3}
        />
      </div>
      <div style={{ margin: 20 }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>API-KEY</div>
        <textarea
          style={{
            fontSize: 15,
            width: 260,
            padding: 5,
            borderColor: "#e0e5df",
            borderRadius: 5,
          }}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="请输入你的key"
        />
      </div>

      <div style={{ margin: 20 }}>
        <div
          style={{
            fontSize: 15,
            color: "#808080",
            marginBottom: 10,
            width: 260,
          }}
        >
          {" "}
          {tips}
        </div>
        {finish ? (
          <Button
            style={{
              backgroundColor: "#32a1ff",
              width: 100,
              height: 40,
              color: "white",
              fontSize: 15,
            }}
            onClick={async () => handleTransform()}
          >
            运行
          </Button>
        ) : (
          <Button
            style={{
              backgroundColor: "#bd3124",
              width: 100,
              height: 40,
              color: "white",
              fontSize: 15,
            }}
          >
            正在运行
          </Button>
        )}
      </div>
    </div>
  );
}

export default Home;
