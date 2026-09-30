import test from "node:test";
import assert from "node:assert/strict";
import { resolveVideoSource } from "../src/utils/media.js";
import { validatePassword } from "../src/utils/password.js";
import { isImageDataUrl } from "../src/utils/validators.js";

test("password requires every character class and respects bcrypt's UTF-8 limit", () => {
  for (const password of ["Password1!", "Valid#2026", "Aa1!" + "x".repeat(68)]) assert.equal(validatePassword(password), "");
  for (const password of ["password123", "PASSWORD1!", "Password!!", "Password12", "Aa1!", "Valid 123!", null, {}, 12345678, "Aa1!" + "é".repeat(35)]) {
    assert.ok(validatePassword(password), "must reject " + JSON.stringify(password));
  }
});

test("YouTube links use an allowlisted embedded player", () => {
  for (const url of [
    "https://youtube.com/watch?v=dQw4w9WgXcQ&feature=shared",
    "https://youtu.be/dQw4w9WgXcQ?t=12",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://m.youtube.com/live/dQw4w9WgXcQ",
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  ]) {
    assert.equal(resolveVideoSource(url)?.kind, "youtube");
    assert.equal(resolveVideoSource(url)?.src, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  }
});

test("direct media keeps signed query parameters and rejects unsafe or unsupported URLs", () => {
  for (const extension of ["mp4", "webm", "ogg", "ogv", "m4v", "MP4"]) {
    const url = "https://media.example/video." + extension + "?signature=123";
    assert.equal(resolveVideoSource(url)?.src, url);
    assert.equal(resolveVideoSource(url)?.kind, "file");
  }
  for (const url of ["javascript:alert(1)", "data:video/mp4,test", "blob:https://example.com/id", "/local.mp4",
    "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=bad",
    "https://example.com/page", "https://drive.google.com/file/d/id/view", "https://user:pass@example.com/video.mp4", "", null]) {
    assert.equal(resolveVideoSource(url), null, String(url));
  }
});

test("profile avatars accept only safe image data URLs", () => {
  assert.equal(isImageDataUrl("data:image/png;base64,iVBORw0KGgo="), true);
  assert.equal(isImageDataUrl("data:image/jpeg;base64,/9j/4AAQSkZJRg=="), true);
  assert.equal(isImageDataUrl("data:image/svg+xml;base64,PHN2Zy8+"), false);
  assert.equal(isImageDataUrl("data:text/html;base64,PGgxPk5vPC9oMT4="), false);
  assert.equal(isImageDataUrl("javascript:alert(1)"), false);
});
