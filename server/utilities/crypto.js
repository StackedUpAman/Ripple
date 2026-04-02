import crypto from 'crypto';

export const generateMemberId = (groupId, privateKey) => {
    return crypto.createHash('sha256').update(groupId + privateKey).digest('hex');
};

export const generateAnonName = (memberId) => {
    return `Anon-${memberId.substring(0, 4).toUpperCase()}`;
};
