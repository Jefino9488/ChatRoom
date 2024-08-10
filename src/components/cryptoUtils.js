export const getEncryptionKey = async (keyString) => {
    const enc = new TextEncoder();
    const keyData = enc.encode(keyString);

    // Ensure the key data is exactly 32 bytes long for AES-256
    const keyData32 = keyData.slice(0, 32); // Use only the first 32 bytes if the key is longer

    return crypto.subtle.importKey(
        "raw",
        keyData32,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );
};


export const encryptMessage = async (message, key) => {
    const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
    const enc = new TextEncoder();
    const encodedMessage = enc.encode(message);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv,
        },
        key,
        encodedMessage
    );

    return {
        cipherText: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv)
    };
};

export const decryptMessage = async (cipherText, key, iv) => {
    const dec = new TextDecoder();
    const encryptedData = base64ToArrayBuffer(cipherText);
    const ivArray = base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivArray,
        },
        key,
        encryptedData
    );

    return dec.decode(decrypted);
};

const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
    return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
};
