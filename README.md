# Wink - Shadowrocket Quota & VIP Bypass

Cấu hình và script Shadowrocket giúp mở khóa không giới hạn lượt dùng thử tính năng AI Cloud Render & SVIP cho ứng dụng **Wink iOS**.

## 🚀 Cài Đặt Nhanh Vào Shadowrocket

### Cách 1: Tải trực tiếp file Cấu hình (Config)
1. Mở ứng dụng **Shadowrocket**.
2. Chọn tab **Cấu hình** (Config) -> Bấm dấu **+** ở góc trên bên phải.
3. Dán liên kết cấu hình sau:
`	ext
https://raw.githubusercontent.com/Hibandd122/Wink-Shadowrocket/main/Wink_Shadowrocket.conf
`
4. Bấm **Tải về** (Download) -> Chọn file cấu hình vừa tải và bấm **Sử dụng cấu hình**.

---

### Cách 2: Thêm từng Script thủ công
Nếu bạn đang dùng file config cá nhân khác, chỉ cần thêm các dòng sau vào mục **[Script]** và **[MITM]**:

#### [MITM]
`ini
hostname = api-sub.meitu.com, *.meitu.com
`

#### [Script]
`ini
WinkBlockConsume = type=http-request,pattern=^https?:\/\/.*meitu\.com\/(v2\/function\/user\/consume|v1\/virtual\/account\/record\/consume)\.json,script-path=https://raw.githubusercontent.com/Hibandd122/Wink-Shadowrocket/main/wink_quota.js

WinkMockCheck = type=http-response,pattern=^https?:\/\/.*meitu\.com\/v2\/function\/(user\/check|strategy\/free)\.json,script-path=https://raw.githubusercontent.com/Hibandd122/Wink-Shadowrocket/main/wink_quota.js,requires-body=true,max-size=0

WinkMockEntrance = type=http-response,pattern=^https?:\/\/.*meitu\.com\/v2\/entrance\/products_by_function\.json,script-path=https://raw.githubusercontent.com/Hibandd122/Wink-Shadowrocket/main/wink_quota.js,requires-body=true,max-size=0

WinkMockVIP = type=http-response,pattern=^https?:\/\/.*meitu\.com\/v2\/(user\/vip_info|user\/login_vip_check|user\/login_limit_check|contract\/sub\/get_valid_contract|transaction\/permission_check)\.json,script-path=https://raw.githubusercontent.com/Hibandd122/Wink-Shadowrocket/main/wink_quota.js,requires-body=true,max-size=0
`

---

## ⚠️ BƯỚC BẮT BUỘC: Cài Đặt Chứng Chỉ HTTPS (MITM)
1. Trong Shadowrocket: Vào **Cấu hình** -> Bấm vào file cấu hình đang dùng -> Chọn **Chỉnh sửa cấu hình**.
2. Tìm mục **Giải mã HTTPS (HTTPS Decryption / MITM)** -> Bật **Giải mã HTTPS**.
3. Bấm **Tạo chứng chỉ mới** (Generate New Certificate) -> Bấm **Cài đặt chứng chỉ vào hệ thống**.
4. Mở **Cài đặt (Settings)** của iPhone -> Chọn **Đã tải về hồ sơ** -> Bấm **Cài đặt**.
5. Vào **Cài đặt chung** -> **Giới thiệu** -> **Cài đặt tin cậy chứng chỉ** (Certificate Trust Settings) -> Gạt **BẬT** cho chứng chỉ của Shadowrocket.
6. Bật kết nối VPN của Shadowrocket và mở Wink để sử dụng.
