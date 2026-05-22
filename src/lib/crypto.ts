// ============================================================================
// خدمة التشفير - AES-GCM باستخدام Web Crypto API
// ============================================================================
// يستخدم PBKDF2 لاشتقاق المفتاح مع 100,000 تكرار
// تشفير AES-GCM بقوة 256 بت
// التنسيق: [salt(16)][iv(12)][بيانات مشفرة]
// ============================================================================

/** عدد تكرارات PBKDF2 لاشتقاق المفتاح */
const PBKDF2_ITERATIONS = 100_000;

/** حجم الملح بالبايت */
const SALT_LENGTH = 16;

/** حجم المتجه الأولي (IV) بالبايت */
const IV_LENGTH = 12;

/**
 * اشتقاق مفتاح تشفير من كلمة المرور باستخدام PBKDF2
 * @param password - كلمة المرور
 * @param salt - الملح (16 بايت)
 * @returns مفتاح CryptoKey للتشفير
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  // تحويل كلمة المرور إلى ArrayBuffer
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // استيراد كلمة المرور كمادة أولية للمفتاح
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // اشتقاق المفتاح باستخدام PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * تشفير بيانات نصية باستخدام كلمة مرور
 * @param data - البيانات النصية المراد تشفيرها
 * @param password - كلمة المرور
 * @returns بيانات مشفرة بصيغة Uint8Array (salt + iv + encrypted)
 */
export async function encrypt(data: string, password: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // توليد ملح عشوائي
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  // توليد متجه أولي عشوائي
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // اشتقاق المفتاح
  const key = await deriveKey(password, salt);

  // التشفير باستخدام AES-GCM
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  const encrypted = new Uint8Array(encryptedBuffer);

  // تجميع النتيجة: [salt(16)][iv(12)][encrypted]
  const result = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.length);
  result.set(salt, 0);
  result.set(iv, SALT_LENGTH);
  result.set(encrypted, SALT_LENGTH + IV_LENGTH);

  return result;
}

/**
 * فك تشفير بيانات مشفرة باستخدام كلمة مرور
 * @param encryptedData - البيانات المشفرة (salt + iv + encrypted)
 * @param password - كلمة المرور
 * @returns البيانات النصية الأصلية
 */
export async function decrypt(encryptedData: Uint8Array, password: string): Promise<string> {
  // استخراج الملح
  const salt = encryptedData.slice(0, SALT_LENGTH);

  // استخراج المتجه الأولي
  const iv = encryptedData.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);

  // استخراج البيانات المشفرة
  const data = encryptedData.slice(SALT_LENGTH + IV_LENGTH);

  // اشتقاق المفتاح
  const key = await deriveKey(password, salt);

  // فك التشفير
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}

/**
 * تحويل Uint8Array إلى نص Base64 للتخزين
 * @param array - المصفوفة المراد تحويلها
 * @returns نص Base64
 */
export function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

/**
 * تحويل نص Base64 إلى Uint8Array
 * @param base64 - النص بصيغة Base64
 * @returns مصفوفة Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}
