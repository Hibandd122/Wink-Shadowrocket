/*
 * Shadowrocket / Loon / Quantumult X Script: Pure Unlimited Quota (Không cần SVIP, Không giới hạn lượt)
 *
 * 1. Chặn toàn bộ lệnh trừ lượt làm nét (Consume & Rollback):
 *    - /subscribe/*consume* & /subscribe/*rollback*
 *    - /v2/function/user/consume.json & /v1/virtual/account/record/consume.json
 * 2. Mở khóa vĩnh viễn quyền làm nét miễn phí (Unlimited Free Quota):
 *    - /subscribe/portrait_enhance_right_valid -> single_purchase_valid: 1, free_num: 9999
 *    - /subscribe/meidou_func_limit_valid -> need_recharge_coin: false, photo_avail_left: 9999
 *    - /subscribe/func_limit & /subscribe/func_limit_batch_query -> limit_flag: 0, free_num: 9999, total_num: 9999
 *    - /v2/function/user/check.json & /v2/function/strategy/free.json -> is_free: true, free_count: 999
 *    - /v2/entrance/products_by_function.json -> is_free: true, free_count: 999
 * 3. Chặn popup mời mua gói:
 *    - /user_layer/vip_popup_product_brief.json -> data: null
 */

const url = $request.url;

// TRƯỜNG HỢP 1: Chặn Request trừ lượt (REQUEST INTERCEPTION - Trả về thành công ngay lập tức)
if (typeof $response === "undefined") {
    const isConsume = url.includes("consume") || 
                      url.includes("rollback") || 
                      url.includes("type=consume") ||
                      (typeof $request.body === "string" && $request.body.includes("type=consume"));

    if (isConsume) {
        console.log("[WinkQuota] [CHẶN TRỪ LƯỢT]: " + url.split('?')[0]);
        
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
// TRƯỜNG HỢP 2: Giả lập Quota vô hạn trong Response (RESPONSE MODIFICATION)
else {
    let body = $response.body;
    if (body) {
        try {
            let obj = JSON.parse(body);

            // =========================================================================
            // 0. XÁC THỰC QUYỀN LÀM NÉT CHÂN DUNG / HD (portrait_enhance_right_valid)
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
                console.log("[WinkQuota] [MỞ KHÓA LÀM NÉT] Portrait Enhance -> 9999 lượt miễn phí");
            }
            // =========================================================================
            // 1. MEIDOU FUNC LIMIT VALID (Không đòi nạp hạt đậu)
            // =========================================================================
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
                console.log("[WinkQuota] [BỎ QUA NẠP ĐẬU] Meidou Valid -> Còn 9999 ảnh");
            }
            // =========================================================================
            // 2. TOÀN BỘ CÁC API SUBSCRIBE / FUNC_LIMIT CÒN LẠI (Vô hạn 9999 lượt)
            // =========================================================================
            else if (url.includes("/subscribe/")) {
                if (!obj.meta) obj.meta = { code: 0, msg: "success" };
                obj.meta.code = 0;
                
                if (obj.response) {
                    if (Array.isArray(obj.response.items)) {
                        obj.response.items.forEach(item => {
                            item.limit_flag = 0;       // Không giới hạn
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
                console.log("[WinkQuota] [VESDK QUOTA] Set 9999 lượt: " + url.split('?')[0]);
            }
            // =========================================================================
            // 3. SỐ DƯ HẠT ĐẬU ẢO
            // =========================================================================
            else if (url.includes("/v1/meidou/account/balance.json")) {
                obj.code = 0;
                obj.data = {
                    balance: 99999,
                    gift_balance: 99999,
                    paid_balance: 99999,
                    total_balance: 99999
                };
            }
            // =========================================================================
            // 4. CHẶN POPUP MỜI MUA VIP
            // =========================================================================
            else if (url.includes("/user_layer/vip_popup_product_brief.json")) {
                obj.code = 0;
                obj.message = "success";
                obj.data = null;
                obj.success = true;
                console.log("[WinkQuota] [CHẶN POPUP] Đã tắt popup mời mua VIP");
            }
            // =========================================================================
            // 5. FUNCTION CHECK & STRATEGY FREE (Giữ luôn 999 lượt dùng thử)
            // =========================================================================
            else if (url.includes("/v2/function/user/check.json") || url.includes("/v2/function/strategy/free.json")) {
                obj.code = 0;
                obj.error_code = "00000";
                obj.message = "success";
                obj.success = true;

                if (!obj.data) obj.data = {};
                obj.data.is_free = true;
                obj.data.free_count = 999;
                obj.data.right_count = 999;
                obj.data.consume_count = 0;
                obj.data.limit_val = 999;
                obj.data.have_permission = true;

                if (Array.isArray(obj.data.function_list)) {
                    obj.data.function_list.forEach(f => {
                        f.is_free = true;
                        f.free_count = 999;
                        f.right_count = 999;
                        f.consume_count = 0;
                        f.limit_val = 999;
                    });
                }
                console.log("[WinkQuota] [QUOTA CHECK] Luôn còn 999 lượt");
            }
            // =========================================================================
            // 6. PRODUCTS BY FUNCTION
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
            }

            $done({ body: JSON.stringify(obj) });
        } catch (e) {
            $done({});
        }
    } else {
        $done({});
    }
}
