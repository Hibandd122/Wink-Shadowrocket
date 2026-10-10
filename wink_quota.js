/*
 * Shadowrocket / Loon / Quantumult X Script: Comprehensive Quota & VIP Bypass for Wink (Meitu)
 * 
 * 1. Chặn lệnh trừ lượt tiêu hao Cloud Render / Meidou / VESDK:
 *    - /subscribe/*consume* & /subscribe/*rollback*
 *    - /v2/function/user/consume.json & /v1/virtual/account/record/consume.json
 * 2. Mở khóa làm nét Super Resolution / Portrait Enhance:
 *    - /subscribe/portrait_enhance_right_valid
 *    - /subscribe/meidou_func_limit_valid & /v1/meidou/account/balance.json
 * 3. Mở khóa toàn bộ hạn ngạch VESDK Quota Engine:
 *    - /subscribe/func_limit & /subscribe/func_limit_batch_query
 *    - /subscribe/exclusive_func_limit_query & /subscribe/policy_func_limit_query
 *    - /subscribe/rights_package_query & /subscribe/func_valid_info
 * 4. Mở khóa thông tin SVIP, Contract & Rights Package vĩnh viễn:
 *    - /v2/user/vip_info_by_group.json, /v2/user/info_by_entrance.json
 *    - /v2/contract/sub/get_all_valid_contract.json
 *    - /user/rights_package.json
 *    - /user_layer/vip_popup_product_brief.json (Chặn popup mua hàng)
 */

const url = $request.url;

// TRƯỜNG HỢP 1: Chặn Request trừ lượt (REQUEST INTERCEPTION - Trả về thành công ngay lập tức)
if (typeof $response === "undefined") {
    const isConsume = url.includes("consume") || 
                      url.includes("rollback") || 
                      url.includes("type=consume") ||
                      (typeof $request.body === "string" && $request.body.includes("type=consume"));

    if (isConsume) {
        console.log("[WinkQuota] [BLOCKED] Consume/Rollback request: " + url.split('?')[0]);
        
        let mockResponse = {};
        if (url.includes("/subscribe/")) {
            mockResponse = {
                meta: { code: 0, msg: "success", error: "", request_uri: url },
                response: {
                    limit_flag: 0,
                    total_num: 9999,
                    free_num: 9999,
                    limit_type: 0,
                    use_num: 0,
                    can_share: 1,
                    preview_flag: 0,
                    status: 1
                }
            };
        } else {
            mockResponse = {
                code: 0,
                error_code: "00000",
                message: "success",
                data: { consume_status: 1, status: 1 },
                success: true
            };
        }

        $done({
            response: {
                status: 200,
                headers: { 
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(mockResponse)
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

            // =========================================================================
            // 0. VESDK SUBSCRIBE ENGINE (Làm nét Chân dung / HD / Meidou / Func limits)
            // =========================================================================
            if (url.includes("/subscribe/portrait_enhance_right_valid")) {
                obj.meta = { code: 0, msg: "success", error: "", request_uri: "/subscribe/portrait_enhance_right_valid" };
                obj.response = {
                    single_purchase_valid: 1,
                    is_valid: true,
                    have_permission: true,
                    share_limit_left_num: 9999,
                    motivate_total_num: 9999,
                    limit_flag: 0,
                    total_num: 9999,
                    free_num: 9999,
                    left_num: 9999
                };
                console.log("[WinkQuota] [MOCKED] Portrait Enhance Right Valid -> UNLIMITED");
            }
            else if (url.includes("/subscribe/meidou_func_limit_valid") || url.includes("/subscribe/meidou_")) {
                obj.meta = { code: 0, msg: "success", error: "", request_uri: "/subscribe/meidou_func_limit_valid" };
                obj.response = {
                    need_recharge_coin: false,
                    need_cost_free_num: 0,
                    coin_recharge_flag: 0,
                    photo_right_left: 9999,
                    photo_avail_left: 9999,
                    photo_current_free: 9999,
                    photo_difference: 0,
                    photo_difference_cost_coin: 0,
                    duration_right_left: 9999,
                    duration_avail_left: 9999,
                    duration_current_free: 9999,
                    duration_difference: 0,
                    duration_difference_cost_coin: 0,
                    local_generation: false
                };
                console.log("[WinkQuota] [MOCKED] Meidou Func Limit Valid -> UNLIMITED");
            }
            else if (url.includes("/subscribe/")) {
                if (!obj.meta) obj.meta = { code: 0, msg: "success" };
                obj.meta.code = 0;
                
                if (obj.response) {
                    if (Array.isArray(obj.response.items)) {
                        obj.response.items.forEach(item => {
                            item.limit_flag = 0;
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
                console.log("[WinkQuota] [MOCKED UNLIMITED] VESDK Subscribe: " + url.split('?')[0]);
            }
            // =========================================================================
            // 1. MEIDOU BALANCE & PRODUCTS (/v1/meidou/)
            // =========================================================================
            else if (url.includes("/v1/meidou/account/balance.json")) {
                obj.code = 0;
                obj.data = {
                    balance: 99999,
                    gift_balance: 99999,
                    paid_balance: 99999,
                    total_balance: 99999
                };
                console.log("[WinkQuota] [MOCKED] Meidou Balance -> 99999");
            }
            // =========================================================================
            // 2. USER RIGHTS PACKAGE
            // =========================================================================
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
            // =========================================================================
            // 3. MEITU AI TOOL INITS (Old Photo Repair, Image Repair, Super Resolution)
            // =========================================================================
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
            // =========================================================================
            // 4. USER INFO BY ENTRANCE (Mở khóa cửa tính năng)
            // =========================================================================
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
            // =========================================================================
            // 5. CHẶN POPUP MỜI MUA VIP
            // =========================================================================
            else if (url.includes("/user_layer/vip_popup_product_brief.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.data = null;
                obj.success = true;
                console.log("[WinkQuota] [BLOCKED POPUP] VIP purchase popup suppressed");
            }
            // =========================================================================
            // 6. QUOTA CHECK & STRATEGY FREE (Cũ)
            // =========================================================================
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
                console.log("[WinkQuota] [MOCKED] Quota set to 999 for: " + url.split('?')[0]);
            }
            // =========================================================================
            // 7. PRODUCTS BY FUNCTION
            // =========================================================================
            else if (url.includes("/v2/entrance/products_by_function.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                if (obj.data) {
                    obj.data.is_free = true;
                    obj.data.free_count = 999;
                    obj.data.have_permission = true;
                }
                console.log("[WinkQuota] [MOCKED] Products by function for: " + url.split('?')[0]);
            }
            // =========================================================================
            // 8. VIP INFO & LOGIN VIP CHECK
            // =========================================================================
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
            // =========================================================================
            // 9. VALID CONTRACTS
            // =========================================================================
            else if (url.includes("/v2/contract/sub/get_")) {
                obj.code = 0;
                obj.error_code = "00000";
                obj.message = "success";
                obj.success = true;
                obj.data = [{
                    product_id: "com.meitu.wink.autorenew.vip.year",
                    order_id: "999999999999999",
                    status: 1,
                    start_time: "1700000000000",
                    end_time: "32495529599000",
                    valid_time: "1700000000000",
                    invalid_time: "32495529599000",
                    is_valid: true
                }];
                console.log("[WinkQuota] [MOCKED CONTRACT] " + url.split('?')[0]);
            }
            // =========================================================================
            // 10. PERMISSION CHECK & LOGIN LIMIT CHECK
            // =========================================================================
            else if (url.includes("/v2/transaction/permission_check.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                obj.data = { has_permission: true };
                console.log("[WinkQuota] [MOCKED] Permission check for: " + url.split('?')[0]);
            }
            else if (url.includes("/v2/user/login_limit_check.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.success = true;
                obj.data = { is_limit: false };
                console.log("[WinkQuota] [MOCKED] Login limit check for: " + url.split('?')[0]);
            }

            $done({ body: JSON.stringify(obj) });
        } catch (e) {
            $done({});
        }
    } else {
        $done({});
    }
}
