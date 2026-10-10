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

        # 1. Chặn lệnh trừ lượt Cloud Render, Tài khoản ảo & VESDK Quota Consume
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
        elif "/subscribe/func_limit" in url and ("type=consume" in url or (flow.request.content and b"type=consume" in flow.request.content)):
            print(f"[WinkQuota] [BLOCKED] VESDK consume request: {url}")
            mock_body = {
                "meta": {"code": 0, "msg": "", "error": "", "request_uri": "/subscribe/func_limit"},
                "response": {
                    "limit_flag": 0,
                    "total_num": 9999,
                    "free_num": 9999,
                    "limit_type": 0,
                    "use_num": 0,
                    "can_share": 1,
                    "preview_flag": 0
                }
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
        host = flow.request.pretty_host

        if not flow.response or not flow.response.content:
            return

        # Can thiep ca meitu.com va meitumv.com
        if "meitu.com" not in host and "meitumv.com" not in host and "meitudata.com" not in host:
            return

        try:
            content = flow.response.content.decode("utf-8", errors="ignore")
            obj = json.loads(content)
        except Exception:
            return

        modified = False

        # 0. VESDK Feature Limits (VESDK Core Quota Engine cho Wink 3.18+)
        if "/subscribe/func_limit" in url:
            if "response" in obj and isinstance(obj["response"], dict):
                resp_data = obj["response"]
                if "items" in resp_data and isinstance(resp_data["items"], list):
                    for item in resp_data["items"]:
                        item["limit_flag"] = 0        # 0 = Khong gioi han
                        item["total_num"] = 9999
                        item["free_num"] = 9999
                        item["limit_type"] = 0
                        item["use_num"] = 0
                        item["can_share"] = 1
                        item["preview_flag"] = 0
                else:
                    resp_data["limit_flag"] = 0
                    resp_data["total_num"] = 9999
                    resp_data["free_num"] = 9999
                    resp_data["limit_type"] = 0
                    resp_data["use_num"] = 0
                    resp_data["can_share"] = 1
                    resp_data["preview_flag"] = 0
                modified = True
                print(f"[WinkQuota] [MOCKED UNLIMITED] VESDK Func Limit: {url.split('?')[0]}")

        # 0.1 Rights Package (Goi quyen loi nguoi dung cua Wink)
        elif "/user/rights_package.json" in url:
            obj["code"] = 0
            if "data" not in obj or not isinstance(obj["data"], dict):
                obj["data"] = {}
            obj["data"]["rights_package"] = {
                "in_use": 1,
                "photo_free_total": 9999,
                "photo_free_used": 0,
                "photo_free_left": 9999,
                "duration_free_total": 999999,
                "duration_free_used": 0,
                "duration_free_left": 999999,
                "valid_days": 9999,
                "remaining_days": 9999
            }
            modified = True
            print(f"[WinkQuota] [MOCKED RIGHTS] User Rights Package set to 9999")

        # 0.2 Meitu AI Tool Inits (Old Photo Repair, Image Repair, Super Resolution, etc.)
        elif "/meitu_ai/" in url:
            if "response" in obj and isinstance(obj["response"], dict):
                r_ai = obj["response"]
                r_ai["is_vip"] = True
                if "func" in r_ai and isinstance(r_ai["func"], dict):
                    r_ai["func"]["time_range"] = "forever"
                    r_ai["func"]["total_num"] = 9999
                    r_ai["func"]["vip_total_num"] = 9999
                    r_ai["func"]["free_num"] = 9999
                    r_ai["func"]["used_num"] = 0
                if "right" in r_ai and isinstance(r_ai["right"], dict):
                    r_ai["right"]["total_num"] = 9999
                    r_ai["right"]["left_num"] = 9999
                modified = True
                print(f"[WinkQuota] [MOCKED AI TOOL] {url.split('?')[0]}")

        # 0.3 User Info by Entrance
        elif "/v2/user/info_by_entrance.json" in url:
            obj["code"] = 0
            obj["error_code"] = "00000"
            obj["message"] = "success"
            obj["success"] = True
            if "data" not in obj or not isinstance(obj["data"], dict):
                obj["data"] = {}
            orig_vip = obj["data"].get("vip_info") or {}
            obj["data"]["vip_info"] = {
                "account_type": orig_vip.get("account_type", 2),
                "account_id": str(orig_vip.get("account_id", "18834583572831305")),
                "is_vip": True,
                "use_vip": True,
                "type": 2,
                "type_name": "SVIP",
                "valid_time": "1700000000000",
                "invalid_time": "32495529599000",
                "have_valid_contract": True,
                "show_renew_flag": False,
                "show_renew_flag_abroad": False,
                "in_trial_period": False,
                "in_grace_period": False,
                "limit_type": 0
            }
            modified = True
            print(f"[WinkQuota] [MOCKED ENTRANCE VIP] {url.split('?')[0]}")

        # 0.4 Chặn Popup mời mua VIP (User Layer VIP Popup)
        elif "/user_layer/vip_popup_product_brief.json" in url:
            obj["code"] = 0
            obj["message"] = "success"
            obj["data"] = None
            obj["success"] = True
            modified = True
            print(f"[WinkQuota] [BLOCKED POPUP] VIP purchase popup suppressed: {url.split('?')[0]}")

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
            
            orig_data = obj.get("data") or {}
            account_id = orig_data.get("account_id", "18834583572831305")
            account_type = orig_data.get("account_type", 2)
            
            # Meitu dùng timestamp mili-giây (13 chữ số) -> tránh lỗi năm 1970
            obj["data"] = {
                "account_id": str(account_id),
                "account_type": account_type,
                "is_vip": True,
                "use_vip": True,
                "active_sub_type": 2,
                "active_sub_type_name": "VIP",
                "sub_type": 2,
                "sub_type_name": "VIP",
                "type": 2,
                "type_name": "SVIP",
                "valid_time": "1700000000000",
                "invalid_time": "32495529599000",
                "current_order_invalid_time": "32495508000000",
                "expire_days": 99999,
                "have_valid_contract": True,
                "show_renew_flag": False,
                "show_renew_flag_abroad": False,
                "in_trial_period": False,
                "in_grace_period": False,
                "limit_type": 0,
                "membership": {
                    "id": "4",
                    "display_name": "Wink SVIP",
                    "level": 1,
                    "level_name": "SVIP"
                }
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
