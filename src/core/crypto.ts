import CryptoJS from 'crypto-js';

export const COURSE_GRADING_SECRET_KEY = 'Client8Sess!06ID';

/**
 * 武大一体化平台 (CourseGrading) 前端密码加密算法
 * 采用 AES-ECB 模式与 PKCS7 填充，密钥为固定 Client8Sess!06ID
 */
export function encryptPassword(password: string, secretKey = COURSE_GRADING_SECRET_KEY): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const encrypted = CryptoJS.AES.encrypt(password, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

/**
 * 解密函数（供测试与逆向校验）
 */
export function decryptPassword(ciphertext: string, secretKey = COURSE_GRADING_SECRET_KEY): string {
  const key = CryptoJS.enc.Utf8.parse(secretKey);
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}
