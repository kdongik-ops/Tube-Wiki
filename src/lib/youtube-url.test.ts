import { describe, expect, it } from "vitest";
import { extractVideoId } from "./youtube-url";

const ID = "dQw4w9WgXcQ";

describe("extractVideoId", () => {
  const valid: Array<[string, string]> = [
    ["watch 기본", `https://www.youtube.com/watch?v=${ID}`],
    ["watch 추가 쿼리", `https://www.youtube.com/watch?v=${ID}&t=42s&list=abc`],
    ["youtu.be 단축", `https://youtu.be/${ID}`],
    ["youtu.be 쿼리 포함", `https://youtu.be/${ID}?t=10`],
    ["shorts", `https://www.youtube.com/shorts/${ID}`],
    ["embed", `https://www.youtube.com/embed/${ID}`],
    ["모바일 m.youtube.com", `https://m.youtube.com/watch?v=${ID}`],
  ];

  it.each(valid)("%s → videoId 추출", (_label, url) => {
    expect(extractVideoId(url)).toBe(ID);
  });

  const invalid: Array<[string, string]> = [
    ["빈 문자열", ""],
    ["공백만", "   "],
    ["URL 형식 아님", "not a url"],
    ["유튜브 아닌 도메인", "https://vimeo.com/123456789"],
    ["v 파라미터 없음", "https://www.youtube.com/watch?x=abc"],
    ["11자 미만 id", "https://youtu.be/short"],
    ["11자 초과 id", `https://youtu.be/${ID}EXTRA`],
    ["허용되지 않은 문자", "https://youtu.be/aaaaaaaaaa!"],
  ];

  it.each(invalid)("%s → null", (_label, input) => {
    expect(extractVideoId(input)).toBeNull();
  });
});
