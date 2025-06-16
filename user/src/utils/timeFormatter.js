import { formatDistanceToNow, isValid } from "date-fns";
import { vi } from "date-fns/locale";

/**
 * Định dạng thời gian từ một giá trị thô (có thể là chuỗi, null, undefined) thành khoảng cách thời gian.
 * Trả về một chuỗi dễ đọc (ví dụ: "cách đây 5 phút", "vào ngày 10/10/2023").
 *
 * @param {string | Date | null | undefined} rawTime Giá trị thời gian cần định dạng.
 * @param {string} [defaultValue="Không rõ"] Giá trị trả về nếu thời gian không hợp lệ hoặc không tồn tại.
 * @returns {string} Chuỗi thời gian đã định dạng hoặc giá trị mặc định.
 */
export function formatTimeAgo(rawTime, defaultValue = "Không rõ") {
    if (!rawTime) {
        // Giá trị là null, undefined, hoặc chuỗi rỗng
        console.warn("Giá trị thời gian rỗng hoặc không tồn tại:", rawTime);
        return defaultValue;
    }

    const dateObject = new Date(rawTime);

    if (isValid(dateObject)) {
        try {
            // Định dạng khoảng cách thời gian (ví dụ: "cách đây 5 phút")
            let formattedDistance = formatDistanceToNow(dateObject, { addSuffix: true, locale: vi });

            // Loại bỏ tiền tố "khoảng " nếu có
            formattedDistance = formattedDistance.replace(/^khoảng /, "");

            // Nếu muốn, bạn có thể thêm logic để định dạng sang ngày cụ thể
            // nếu thời gian quá xa (ví dụ: hơn 7 ngày)
            // if (Math.abs(new Date().getTime() - dateObject.getTime()) > 7 * 24 * 60 * 60 * 1000) {
            //     return format(dateObject, "dd/MM/yyyy", { locale: vi });
            // }

            return formattedDistance;
        } catch (e) {
            console.error("Lỗi khi định dạng thời gian với date-fns:", e);
            return "Lỗi định dạng thời gian"; // Trả về thông báo lỗi cụ thể
        }
    } else {
        // Giá trị không thể chuyển đổi thành Date object hợp lệ (ví dụ: "abc", "2023-13-01")
        console.warn("Giá trị thời gian không hợp lệ (Invalid Date):", rawTime);
        return defaultValue;
    }
}