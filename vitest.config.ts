import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // 정책 검사 테스트들이 같은 임시 파일(src/lib/__policy_check_temp_violation.ts)을 쓰고 지운다.
    // 파일 병렬 실행에서는 한쪽이 만든 파일을 다른 쪽이 지워 검사 결과가 뒤집히므로 순차 실행한다.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": `${__dirname}/src`,
    },
  },
});
