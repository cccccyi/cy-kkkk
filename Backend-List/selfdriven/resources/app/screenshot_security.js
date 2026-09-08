"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const CAPTURE_TTL_MS = 30 * 1000;
const MAX_FILENAME_LENGTH = 240;
const MAX_CAPTURE_DIMENSION = 32768;
const pendingCaptures = new Map();

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function samePath(left, right) {
  if (process.platform === "win32") {
    return left.toLowerCase() === right.toLowerCase();
  }
  return left === right;
}

function realpath(targetPath) {
  return fs.realpathSync.native ? fs.realpathSync.native(targetPath) : fs.realpathSync(targetPath);
}

function validateRectangle(rectangle) {
  if (rectangle === undefined || rectangle === null || rectangle === false) return undefined;
  if (!isPlainObject(rectangle)) throw new Error("Invalid screenshot rectangle");

  const keys = Object.keys(rectangle).sort();
  if (keys.join(",") !== "height,width,x,y") throw new Error("Invalid screenshot rectangle fields");

  const result = {};
  for (const key of keys) {
    if (!Number.isInteger(rectangle[key])) throw new Error("Invalid screenshot rectangle value");
    result[key] = rectangle[key];
  }
  if (result.x < 0 || result.y < 0 || result.width < 1 || result.height < 1 ||
      result.width > MAX_CAPTURE_DIMENSION || result.height > MAX_CAPTURE_DIMENSION) {
    throw new Error("Screenshot rectangle is out of range");
  }
  return result;
}

function resolveScreenshotTarget(rootPath, requestedPath) {
  if (typeof rootPath !== "string" || !rootPath || typeof requestedPath !== "string" ||
      !requestedPath || requestedPath.length > 4096 || requestedPath.includes("\0")) {
    throw new Error("Invalid screenshot path");
  }
  if (!path.isAbsolute(requestedPath)) throw new Error("Screenshot path must be absolute");

  const root = realpath(path.resolve(rootPath));
  if (!fs.statSync(root).isDirectory()) throw new Error("Screenshot root is not a directory");

  const requested = path.resolve(requestedPath);
  const filename = path.basename(requested);
  if (!filename || filename === "." || filename === ".." || filename.length > MAX_FILENAME_LENGTH ||
      /[\x00-\x1f\x7f]/.test(filename) || path.extname(filename).toLowerCase() !== ".jpg" ||
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)) {
    throw new Error("Invalid screenshot filename");
  }

  const parent = realpath(path.dirname(requested));
  if (!samePath(parent, root)) throw new Error("Screenshot path is outside the task root");

  const targetPath = path.join(root, filename);
  if (fs.existsSync(targetPath)) {
    const targetStat = fs.lstatSync(targetPath);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw new Error("Screenshot target is not a regular file");
    }
  }
  return { rootPath: root, targetPath, filename };
}

function clearExpiredCaptures(now = Date.now()) {
  for (const [ticket, capture] of pendingCaptures) {
    if (capture.expiresAt <= now) pendingCaptures.delete(ticket);
  }
}

function authorizeCapture(webContents, requestedPath, rootPath, rectangle) {
  if (!webContents || !Number.isInteger(webContents.id)) throw new Error("Invalid screenshot WebContents");
  clearExpiredCaptures();
  const target = resolveScreenshotTarget(rootPath, requestedPath);
  const ticket = crypto.randomBytes(24).toString("hex");
  pendingCaptures.set(ticket, {
    ...target,
    rectangle: validateRectangle(rectangle),
    webContentsId: webContents.id,
    expiresAt: Date.now() + CAPTURE_TTL_MS
  });
  return ticket;
}

function consumeCapture(event, mainWindow, message) {
  if (!mainWindow || mainWindow.isDestroyed() || !event || event.sender !== mainWindow.webContents) {
    throw new Error("Untrusted screenshot sender");
  }
  if (event.senderFrame && mainWindow.webContents.mainFrame &&
      event.senderFrame !== mainWindow.webContents.mainFrame) {
    throw new Error("Screenshot request must come from the main frame");
  }
  if (!isPlainObject(message) || Object.keys(message).join(",") !== "ticket" ||
      typeof message.ticket !== "string" || !/^[a-f0-9]{48}$/.test(message.ticket)) {
    throw new Error("Invalid screenshot message");
  }

  const capture = pendingCaptures.get(message.ticket);
  if (!capture || capture.expiresAt <= Date.now() || capture.webContentsId !== event.sender.id) {
    if (capture && capture.expiresAt <= Date.now()) pendingCaptures.delete(message.ticket);
    throw new Error("Unknown or expired screenshot ticket");
  }
  pendingCaptures.delete(message.ticket);
  return capture;
}

function saveCapture(capture, imageData) {
  if (!capture || !Buffer.isBuffer(imageData) || imageData.length === 0) {
    throw new Error("Invalid screenshot image data");
  }
  if (!samePath(realpath(path.dirname(capture.targetPath)), capture.rootPath)) {
    throw new Error("Screenshot root changed before save");
  }
  if (fs.existsSync(capture.targetPath)) {
    const targetStat = fs.lstatSync(capture.targetPath);
    if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
      throw new Error("Screenshot target changed before save");
    }
  }

  const tempPath = path.join(
    capture.rootPath,
    `.${capture.filename}.${crypto.randomBytes(12).toString("hex")}.tmp`
  );
  const noFollow = fs.constants.O_NOFOLLOW || 0;
  let descriptor;
  try {
    descriptor = fs.openSync(
      tempPath,
      fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | noFollow,
      0o600
    );
    fs.writeFileSync(descriptor, imageData);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;

    if (!samePath(realpath(path.dirname(capture.targetPath)), capture.rootPath)) {
      throw new Error("Screenshot root changed before commit");
    }
    if (fs.existsSync(capture.targetPath)) {
      const targetStat = fs.lstatSync(capture.targetPath);
      if (targetStat.isSymbolicLink() || !targetStat.isFile()) {
        throw new Error("Screenshot target became unsafe");
      }
      // Windows rename does not reliably replace an existing file. Remove only the
      // already-validated regular JPG after the complete replacement is durable.
      if (process.platform === "win32") fs.unlinkSync(capture.targetPath);
    }
    fs.renameSync(tempPath, capture.targetPath);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

module.exports = {
  authorizeCapture,
  consumeCapture,
  resolveScreenshotTarget,
  saveCapture,
  validateRectangle
};
