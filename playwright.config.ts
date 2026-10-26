import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',use:{headless:true,launchOptions:process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}:{}},workers:1});
