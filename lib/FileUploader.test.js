"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
test('basic', async () => {
    const fStats = fs_1.default.statSync('./files/test.pdf');
    const fd = fs_1.default.openSync('./files/test.pdf', 'r');
    const file = {
        p: fd,
        stats: (() => {
            return {
                "pie": "man",
            };
        })
    };
    console.log(await file.stats());
    return file.stats();
});
