// pages/api/chat.js
import { ZhipuAI } from "zhipuai-sdk-nodejs-v4";
import async from 'async';

let concurrentNum = 3;
const chatQueue = async.queue((task, callback) => {
  const { num, model, prompt, apiKey } = task;
  concurrentNum = num;
  const ai = new ZhipuAI({ apiKey });
  ai.createCompletions({
    model: model,
    messages: [{ role: "user", content: prompt }],
    stream: false,
  })
    .then(data => {
      if (data.choices && data.choices.length > 0) {
        callback(null, data.choices[0].message.content); // Call callback with no error and the result
      } else {
        callback(new Error("No content returned")); // Call callback with an error
      }
    })
    .catch(error => {
      callback(error); // Call callback with the caught error
    });

}, concurrentNum);

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { num, model, prompt, apiKey } = req.body;

    // Push task to the queue
    chatQueue.push({ num, model, prompt, apiKey }, (err, result) => {
      // This function is the callback that will be called by the queue worker
      if (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      } else {
        if (chatQueue.idle()) {
          res.status(200).json({ message: result, finish: true });
        }
        else {
          res.status(200).json({ message: result, finish: false });
        }
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
