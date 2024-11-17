const rateLimitWindowMs = 60 * 1000;
const requestCounts = {};

export default function rateLimiter(reqsPerMinute = 20, req, res, next) {
    const requesterIp = req.ip;
    const currentTimestamp = Date.now();

    if (!requestCounts[requesterIp] || currentTimestamp - requestCounts[requesterIp].lastRequest > rateLimitWindowMs) {
        requestCounts[requesterIp] = {count: 1, lastRequest: currentTimestamp};
        return next();
    }

    if (requestCounts[requesterIp].count < reqsPerMinute) {
        requestCounts[requesterIp].count++;
        return next();
    }

    Object.keys(requestCounts).forEach(ip => {
        if (currentTimestamp - requestCounts[ip].lastRequest > rateLimitWindowMs) {
            delete requestCounts[ip];
        }
    });

    return res.status(429).json({message: 'Too many requests, please try again later!'});
}