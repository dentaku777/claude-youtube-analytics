import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto/aes-gcm";

describe("aes-gcm", () => {
  it("暗号化 → 復号で元の文字列に戻る", () => {
    const plaintext = "AIzaSyExampleKey123456789";
    const payload = encrypt(plaintext);
    expect(payload.ciphertext).toBeTypeOf("string");
    expect(payload.iv).toBeTypeOf("string");
    expect(payload.authTag).toBeTypeOf("string");
    expect(decrypt(payload)).toBe(plaintext);
  });

  it("日本語を含む文字列も暗号化 → 復号できる", () => {
    const plaintext = "YouTube動画分析テストキー🎬";
    const payload = encrypt(plaintext);
    expect(decrypt(payload)).toBe(plaintext);
  });

  it("空文字列も扱える", () => {
    const payload = encrypt("");
    expect(decrypt(payload)).toBe("");
  });

  it("同じ平文でも IV のランダム性で異なる ciphertext になる", () => {
    const plaintext = "same-input";
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(a.iv).not.toBe(b.iv);
    // 両方とも復号できる
    expect(decrypt(a)).toBe(plaintext);
    expect(decrypt(b)).toBe(plaintext);
  });

  it("AuthTag が改ざんされた payload は復号失敗", () => {
    const payload = encrypt("sensitive");
    const tampered = {
      ...payload,
      authTag: Buffer.alloc(16).toString("base64"),
    };
    expect(() => decrypt(tampered)).toThrow();
  });

  it("ciphertext が改ざんされた payload は復号失敗", () => {
    const payload = encrypt("sensitive");
    const ciphertextBuf = Buffer.from(payload.ciphertext, "base64");
    ciphertextBuf[0] ^= 0xff; // 1 バイト反転
    const tampered = {
      ...payload,
      ciphertext: ciphertextBuf.toString("base64"),
    };
    expect(() => decrypt(tampered)).toThrow();
  });

  it("payload の長さチェック (IV=12 bytes, AuthTag=16 bytes)", () => {
    const payload = encrypt("x");
    expect(Buffer.from(payload.iv, "base64").length).toBe(12);
    expect(Buffer.from(payload.authTag, "base64").length).toBe(16);
  });
});
