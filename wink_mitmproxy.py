"""
Wink Quota & SVIP Bypass - Mitmproxy Addon (Python)
Tương đương wink_quota.js và Wink_Quota_Shadowrocket.conf

Cách chạy:
    mitmweb -s wink_mitmproxy.py -p 8080 --ssl-insecure
hoặc:
    mitmproxy -s wink_mitmproxy.py -p 8080
"""

import json
from mitmproxy import http

class WinkQuotaBypass:
    def request(self, flow: http.HTTPFlow) -> None:
        url = flow.request.pretty_url

        # 1. Chặn lệnh trừ lượt Cloud Render & Tài khoản ảo
        if "/v2/function/user/consume.json" in url or "/v1/virtual/account/record/consume.json" in url:
            print(f"[WinkQuota] [BLOCKED] Request consume: {url}")
            mock_body = {
                "code": 0,
                "error_code": "00000",
                "message": "success",
                "data": {"consume_status": 1},
                "success": True
            }
            flow.response = http.Response.make(
                200,
                json.dumps(mock_body).encode("utf-8"),
                {
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                }
            )

    def response(self, flow: http.HTTPFlow) -> None:
        url = flow.request.pretty_url

        if not flow.response or not flow.response.content:
            return

        # Chỉ can thiệp các domain meitu.com
        if "meitu.com" not in flow.request.pretty_host:
            return

        try:
            content = flow.response.content.decode("utf-8", errors="ignore")
            obj = json.loads(content)
        except Exception:
            return

        modified = False

        # 2. Quota Check & Strategy Free -> Giả lập 999 lượt dùng thử
        if "/v2/function/user/check.json" in url or "/v2/function/strategy/free.json" in url:
            obj["code"] = 0
            obj["error_code"] = "00000"
            obj["message"] = "success"
            obj["success"] = True

            data = obj.get("data") or {}
            data["is_free"] = True
            data["is_vip"] = True
            data["free_count"] = 999
            data["right_count"] = 999
            data["consume_count"] = 0
            data["limit_val"] = 999
            data["have_permission"] = True

            if "function_list" in data and isinstance(data["function_list"], list):
                for f in data["function_list"]:
                    f["is_free"] = True
                    f["is_vip"] = True
                    f["free_count"] = 999
                    f["right_count"] = 999
                    f["consume_count"] = 0
                    f["limit_val"] = 999

            obj["data"] = data
            modified = True
            print(f"[WinkQuota] [MOCKED] Quota set to 999: {url}")

        # 3. Mở khóa cửa vào tính năng
        elif "/v2/entrance/products_by_function.json" in url:
            obj["code"] = 0
            obj["message"] = "success"
            obj["success"] = True
            data = obj.get("data") or {}
            data["is_free"] = True
            data["free_count"] = 999
            data["have_permission"] = True
            obj["data"] = data
            modified = True
            print(f"[WinkQuota] [MOCKED] Products by function: {url}")

        # 4. Mở khóa VIP Info, VIP Info By Group & Login VIP Check
        elif "/v2/user/vip_info" in url or "/v2/user/login_vip_check.json" in url:
            obj["code"] = 0
            obj["error_code"] = "00000"
            obj["message"] = "success"
            obj["success"] = True
            
            # Giữ lại account_id gốc nếu có
            orig_data = obj.get("data") or {}
            account_id = orig_data.get("account_id", "18834583572831305")
            account_type = orig_data.get("account_type", 2)
            
            obj["data"] = {
                "account_id": account_id,
                "account_type": account_type,
                "is_vip": True,
                "use_vip": True,
                "type": 2,
                "type_name": "SVIP",
                "valid_time": 4102444800,
                "invalid_time": 4102444800,
                "have_valid_contract": True,
                "show_renew_flag": False,
                "show_renew_flag_abroad": False,
                "in_trial_period": False,
                "in_grace_period": False,
                "expire_days": 99999,
                "limit_type": 0
            }
            modified = True
            print(f"[WinkQuota] [MOCKED VIP] {url.split('?')[0]}")

        # 5. Hợp đồng SVIP vĩnh viễn
        elif "/v2/contract/sub/get_valid_contract.json" in url:
            obj["code"] = 0
            obj["message"] = "success"
            obj["success"] = True
            obj["data"] = [{
                "product_id": "com.meitu.wink.vip.year",
                "order_id": "999999999999999",
                "status": 1,
                "start_time": 1700000000,
                "end_time": 4102444800,
                "is_valid": True
            }]
            modified = True
            print(f"[WinkQuota] [MOCKED] Valid Contract: {url}")

        # 6. Permission & Limit check
        elif "/v2/transaction/permission_check.json" in url:
            obj["code"] = 0
            obj["message"] = "success"
            obj["success"] = True
            obj["data"] = {"has_permission": True}
            modified = True
            print(f"[WinkQuota] [MOCKED] Permission check: {url}")

        elif "/v2/user/login_limit_check.json" in url:
            obj["code"] = 0
            obj["message"] = "success"
            obj["success"] = True
            obj["data"] = {"is_limit": False}
            modified = True
            print(f"[WinkQuota] [MOCKED] Login limit: {url}")

        if modified:
            flow.response.content = json.dumps(obj).encode("utf-8")


addons = [
    WinkQuotaBypass()
]
