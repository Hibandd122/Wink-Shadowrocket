/*
 * Shadowrocket / Loon / Quantumult X Script: Comprehensive Quota & VIP Bypass for Wink (Meitu)
 * 
 * 1. Chặn lệnh trừ lượt tiêu hao Cloud Render:
 *    - /v2/function/user/consume.json
 *    - /v1/virtual/account/record/consume.json
 * 2. Giả lập còn 999 lượt dùng thử miễn phí và quyền VIP:
 *    - /v2/function/user/check.json & /v2/function/strategy/free.json
 * 3. Mở khóa gói chức năng dùng thử:
 *    - /v2/entrance/products_by_function.json
 * 4. Mở khóa thông tin VIP và Hợp đồng VIP vĩnh viễn:
 *    - /v2/user/vip_info.json & /v2/contract/sub/get_valid_contract.json
 *    - /v2/transaction/permission_check.json
 *    - /v2/user/login_vip_check.json
 *    - /v2/user/login_limit_check.json
 */

const url = $request.url;

// TRƯỜNG HỢP 1: Chặn Request trừ lượt (REQUEST INTERCEPTION - Trả về thành công ngay lập tức)
if (typeof $response === "undefined") {
    if (url.includes("/v2/function/user/consume.json") || url.includes("/v1/virtual/account/record/consume.json")) {
        console.log("[WinkQuota] [BLOCKED] Request consume quota: " + url);
        $done({
            response: {
                status: 200,
                headers: { 
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify({
                    code: 0,
                    error_code: "00000",
                    message: "success",
                    data: { consume_status: 1 },
                    success: true
                })
            }
        });
    } else if (url.includes("/subscribe/func_limit") && (url.includes("type=consume") || (typeof $request.body === "string" && $request.body.includes("type=consume")))) {
        console.log("[WinkQuota] [BLOCKED] VESDK consume request: " + url);
        $done({
            response: {
                status: 200,
                headers: { 
                    "Content-Type": "application/json; charset=utf-8"
                },
                body: JSON.stringify({
                    meta: { code: 0, msg: "", error: "", request_uri: "/subscribe/func_limit" },
                    response: {
                        limit_flag: 0,
                        total_num: 9999,
                        free_num: 9999,
                        limit_type: 0,
                        use_num: 0,
                        can_share: 1,
                        preview_flag: 0
                    }
                })
            }
        });
    } else {
        $done({});
    }
} 
// TRƯỜNG HỢP 2: Giả lập Quota & VIP trong Response (RESPONSE MODIFICATION)
else {
    let body = $response.body;
    if (body) {
        try {
            let obj = JSON.parse(body);

            // 0. VESDK Feature Limits (Core Quota Engine cho Wink 3.18+)
            if (url.includes("/subscribe/func_limit")) {
                if (obj.response) {
                    if (Array.isArray(obj.response.items)) {
                        obj.response.items.forEach(item => {
                            item.limit_flag = 0;       // 0 = khong gioi han
                            item.total_num = 9999;
                            item.free_num = 9999;
                            item.limit_type = 0;
                            item.use_num = 0;
                            item.can_share = 1;
                            item.preview_flag = 0;
                        });
                    } else if (typeof obj.response === "object") {
                        obj.response.limit_flag = 0;
                        obj.response.total_num = 9999;
                        obj.response.free_num = 9999;
                        obj.response.limit_type = 0;
                        obj.response.use_num = 0;
                        obj.response.can_share = 1;
                        obj.response.preview_flag = 0;
                    }
                }
                console.log("[WinkQuota] [MOCKED UNLIMITED] VESDK Func Limits");
            }
            // 0.1 User Rights Package
            else if (url.includes("/user/rights_package.json")) {
                obj.code = 0;
                if (!obj.data) obj.data = {};
                obj.data.rights_package = {
                    in_use: 1,
                    photo_free_total: 9999,
                    photo_free_used: 0,
                    photo_free_left: 9999,
                    duration_free_total: 999999,
                    duration_free_used: 0,
                    duration_free_left: 999999,
                    valid_days: 9999,
                    remaining_days: 9999
                };
                console.log("[WinkQuota] [MOCKED RIGHTS] User Rights Package set to 9999");
            }
            // 0.2 Meitu AI Tool Inits (Old Photo Repair, Image Repair, Super Resolution)
            else if (url.includes("/meitu_ai/")) {
                if (obj.response && typeof obj.response === "object") {
                    obj.response.is_vip = true;
                    if (obj.response.func && typeof obj.response.func === "object") {
                        obj.response.func.time_range = "forever";
                        obj.response.func.total_num = 9999;
                        obj.response.func.vip_total_num = 9999;
                        obj.response.func.free_num = 9999;
                        obj.response.func.used_num = 0;
                    }
                    if (obj.response.right && typeof obj.response.right === "object") {
                        obj.response.right.total_num = 9999;
                        obj.response.right.left_num = 9999;
                    }
                }
                console.log("[WinkQuota] [MOCKED AI TOOL] " + url.split('?')[0]);
            }
            // 0.3 User Info by Entrance
            else if (url.includes("/v2/user/info_by_entrance.json")) {
                obj.code = 0;
                obj.error_code = "00000";
                obj.message = "success";
                obj.success = true;
                if (!obj.data) obj.data = {};
                let origVip = obj.data.vip_info || {};
                obj.data.vip_info = {
                    account_type: origVip.account_type || 2,
                    account_id: String(origVip.account_id || "18834583572831305"),
                    is_vip: true,
                    use_vip: true,
                    type: 2,
                    type_name: "SVIP",
                    valid_time: "1700000000000",
                    invalid_time: "32495529599000",
                    have_valid_contract: true,
                    show_renew_flag: false,
                    show_renew_flag_abroad: false,
                    in_trial_period: false,
                    in_grace_period: false,
                    limit_type: 0
                };
                console.log("[WinkQuota] [MOCKED ENTRANCE VIP] " + url.split('?')[0]);
            }
            // 0.4 Chặn Popup mời mua VIP (User Layer VIP Popup)
            else if (url.includes("/user_layer/vip_popup_product_brief.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.data = null;
                obj.success = true;
                console.log("[WinkQuota] [BLOCKED POPUP] VIP purchase popup suppressed");
            }
            // 1. Quota Check & Strategy Free (AI Repair, Super Resolution, Old Photo Repair)
            else if (url.includes("/v2/function/user/check.json") || url.includes("/v2/function/strategy/free.json")) {
                obj.code = 0;
                obj.error_code = "00000";
                obj.message = "success";
                obj.success = true;

                if (!obj.data) obj.data = {};
                obj.data.is_free = true;
                obj.data.is_vip = true;
                obj.data.free_count = 999;
                obj.data.right_count = 999;
                obj.data.consume_count = 0;
                obj.data.limit_val = 999;
                obj.data.have_permission = true;

                if (Array.isArray(obj.data.function_list)) {
                    obj.data.function_list.forEach(f => {
                        f.is_free = true;
                        f.is_vip = true;
                        f.free_count = 999;
                        f.right_count = 999;
                        f.consume_count = 0;
                        f.limit_val = 999;
                    });
                }
                console.log("[WinkQuota] [MOCKED] Quota set to 999 for: " + url);
            }

            // 2. Products by function (Mở khóa cửa vào tính năng)
            else if (url.includes("/v2/entrance/products_by_function.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                if (obj.data) {
                    obj.data.is_free = true;
                    obj.data.free_count = 999;
                    obj.data.have_permission = true;
                }
                console.log("[WinkQuota] [MOCKED] Products by function for: " + url);
            }

            // 3. User VIP Info & Login VIP Check (Bypass VIP tong & VIP by group)
            else if (url.includes("/v2/user/vip_info") || url.includes("/v2/user/login_vip_check.json")) {
                obj.code = 0;
                obj.error_code = "00000";
                obj.message = "success";
                obj.success = true;
                
                let origData = obj.data || {};
                let accountId = origData.account_id || "18834583572831305";
                let accountType = origData.account_type || 2;
                
                obj.data = {
                    account_id: String(accountId),
                    account_type: accountType,
                    is_vip: true,
                    use_vip: true,
                    active_sub_type: 2,
                    active_sub_type_name: "VIP",
                    sub_type: 2,
                    sub_type_name: "VIP",
                    type: 2,
                    type_name: "SVIP",
                    valid_time: "1700000000000",
                    invalid_time: "32495529599000",
                    current_order_invalid_time: "32495508000000",
                    expire_days: 99999,
                    have_valid_contract: true,
                    show_renew_flag: false,
                    show_renew_flag_abroad: false,
                    in_trial_period: false,
                    in_grace_period: false,
                    limit_type: 0,
                    membership: {
                        id: "4",
                        display_name: "Wink SVIP",
                        level: 1,
                        level_name: "SVIP"
                    }
                };
                console.log("[WinkQuota] [MOCKED VIP] " + url.split('?')[0]);
            }

            // 4. Valid contracts
            else if (url.includes("/v2/contract/sub/get_valid_contract.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                obj.data = [{
                    product_id: "com.meitu.wink.vip.year",
                    order_id: "999999999999999",
                    status: 1,
                    start_time: 1700000000,
                    end_time: 4102444800,
                    is_valid: true
                }];
                console.log("[WinkQuota] [MOCKED] Contract for: " + url);
            }

            // 5. Permission Check & Login Limit Check
            else if (url.includes("/v2/transaction/permission_check.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                obj.data = { has_permission: true };
                console.log("[WinkQuota] [MOCKED] Permission check for: " + url);
            }
            else if (url.includes("/v2/user/login_limit_check.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                obj.data = { is_limit: false };
                console.log("[WinkQuota] [MOCKED] Login limit check for: " + url);
            }

            $done({ body: JSON.stringify(obj) });
        } catch (e) {
            $done({});
        }
    } else {
        $done({});
    }
}
