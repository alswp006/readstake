// 라우트가 제거된 화면이에요(성취 표시는 Badges 보관함으로 합쳐졌어요).
// 파일 삭제는 파이프라인이 처리하고, 남아 있는 동안 stale import가 깨지지 않도록 후속 화면으로 이어줘요.
export { default } from "./Badges";
