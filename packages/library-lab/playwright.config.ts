import {defineConfig} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',fullyParallel:true,forbidOnly:!!process.env.CI,retries:process.env.CI?1:0,
 reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://127.0.0.1:4319',trace:'retain-on-failure'},
 webServer:{command:process.env.LAB_PREBUILT==='1'?'pnpm preview':'pnpm build && pnpm preview',
  url:'http://127.0.0.1:4319',reuseExistingServer:false,timeout:180_000},
});
