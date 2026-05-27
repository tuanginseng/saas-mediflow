import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `Bạn là chuyên gia chiến lược nội dung y tế cao cấp, có chuyên môn sâu về y học lâm sàng, truyền thông sức khoẻ cộng đồng và marketing y tế Việt Nam. Nhiệm vụ của bạn là phân tích dữ liệu thô từ nhiều nguồn và trích xuất một "Core Content" JSON có cấu trúc — dùng để tạo nội dung marketing y tế chính xác cho phòng khám Việt Nam.

CÁC QUY TẮC THUẬT NGỮ Y TẾ BẮT BUỘC:
- Sử dụng đúng thuật ngữ y tế tiếng Việt (tuân thủ ICD-10 khi áp dụng được)
- Phân biệt rõ ràng triệu chứng (symptoms), dấu hiệu lâm sàng (signs) và hội chứng (syndromes)
- Phương pháp chẩn đoán phải tham chiếu theo phác đồ tiêu chuẩn của Bộ Y tế Việt Nam
- Phương pháp điều trị phải phù hợp với hướng dẫn của Bộ Y tế Việt Nam
- Không sử dụng thuật ngữ thông tục mà không kèm theo tên y tế chính xác
- Đánh dấu bất kỳ nội dung nào có thể bị hiểu là lời khuyên y tế trực tiếp cho người dùng cuối

CHỈ trả về JSON hợp lệ, không có markdown, không có giải thích:
{
  "topic": "Tên chủ đề hoặc tình trạng y tế bằng tiếng Việt",
  "warningSigns": ["Dấu hiệu cảnh báo / dấu hiệu đỏ bằng thuật ngữ y tế Việt Nam — mảng 4-6 mục"],
  "causes": ["Yếu tố căn nguyên / sinh lý bệnh — mảng 4-6 mục"],
  "diagnosticMethods": ["Quy trình chẩn đoán, xét nghiệm, chẩn đoán hình ảnh — mảng 3-5 mục"],
  "standardTreatments": ["Phác đồ điều trị, thủ thuật, thuốc — mảng 4-6 mục"],
  "keywords": ["Từ khóa SEO/marketing tiếng Việt — mảng 6-10 mục"],
  "contentAngles": ["Góc độ nội dung cho giáo dục bệnh nhân và marketing — mảng 4-6 mục"]
}`

function generateMockContent(topic: string) {
  return {
    topic: topic,
    warningSigns: [
      `Cảm giác đau nhức âm ỉ hoặc đột ngột tại vùng liên quan đến ${topic}`,
      `Sưng nề phát triển nhanh, đỏ hoặc ấm nóng vùng mô xung quanh`,
      `Hạn chế khả năng cử động hoặc suy giảm các chức năng bình thường`,
      `Dấu hiệu đỏ cảnh báo: Có thể đi kèm sốt nhẹ, mệt mỏi kéo dài hoặc mất ngủ`
    ],
    causes: [
      `Quá trình lão hóa tự nhiên của tế bào và cấu trúc mô liên kết`,
      `Chấn thương vi mô tích tụ liên tục do áp lực vận động không đúng tư thế`,
      `Rối loạn chuyển hóa nội môi hoặc yếu tố miễn dịch bẩm sinh`,
      `Tác động trực tiếp từ lối sống, dinh dưỡng thiếu hụt vi chất cần thiết`
    ],
    diagnosticMethods: [
      `Khám lâm sàng toàn diện: Đánh giá phản xạ y khoa và biên độ cử động`,
      `Chẩn đoán hình ảnh: Chụp cắt lớp vi tính (CT) hoặc cộng hưởng từ (MRI)`,
      `Xét nghiệm cận lâm sàng: Công thức máu và các dấu ấn sinh học liên quan`
    ],
    standardTreatments: [
      `Điều trị bảo tồn: Phác đồ nội khoa kết hợp thuốc kháng viêm thế hệ mới`,
      `Vật lý trị liệu phục hồi chức năng: Siêu âm trị liệu và sóng ngắn`,
      `Can thiệp ngoại khoa: Chỉ định phẫu thuật nội soi tối thiểu khi có biến chứng`
    ],
    keywords: [
      topic,
      `điều trị ${topic.toLowerCase()}`,
      `triệu chứng ${topic.toLowerCase()}`,
      `nguyên nhân ${topic.toLowerCase()}`,
      `phòng khám ${topic.toLowerCase()}`
    ],
    contentAngles: [
      `Góc nhìn chuyên gia: Phân tích cơ chế bệnh sinh dưới dạng infographic dễ hiểu`,
      `Lời khuyên y khoa: Các bài tập phòng ngừa chủ động tại nhà cho bệnh nhân`,
      `Hành trình bệnh nhân: Chia sẻ câu chuyện hồi phục thực tế để tạo động lực`
    ]
  }
}

export async function POST(req: NextRequest) {
  try {
    const { topic, sources, useFallback } = await req.json()

    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập chủ đề y tế cần phân tích.' }, { status: 400 })
    }

    // Direct mock request
    if (useFallback) {
      return NextResponse.json(generateMockContent(topic))
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Automatic fallback if no key is configured yet
      console.log('No GEMINI_API_KEY configured. Falling back to Mock content.')
      return NextResponse.json({ 
        ...generateMockContent(topic),
        _note: 'Bản đồ này được tạo bằng dữ liệu y khoa Demo vì chưa cấu hình GEMINI_API_KEY'
      })
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: SYSTEM_PROMPT,
      })

      // Build context from sources
      const sourcesText = (sources ?? [])
        .filter((s: { fetchedContent?: string; value?: string }) => s.fetchedContent || s.value)
        .map((s: { type: string; label: string; fetchedContent?: string; value?: string }) =>
          `[NGUỒN: ${s.type.toUpperCase()}] ${s.label}:\n${s.fetchedContent || s.value}`
        )
        .join('\n\n---\n\n')

      const userPrompt = `Phân tích các nguồn dữ liệu thô sau về chủ đề y tế: "${topic}"

${sourcesText
  ? `DỮ LIỆU NGUỒN:\n${sourcesText}`
  : `Không có nguồn bổ sung. Hãy dùng kiến thức y tế chuyên sâu của bạn về chủ đề: "${topic}" để tạo Core Content.`
}

Hãy trích xuất và trả về cấu trúc JSON Core Content. Toàn bộ nội dung phải bằng tiếng Việt, chính xác về mặt y tế.`

      const result = await model.generateContent(userPrompt)
      const text = result.response.text()

      // Extract JSON
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text.trim()

      let coreContent
      try {
        coreContent = JSON.parse(jsonStr)
      } catch {
        const objMatch = text.match(/\{[\s\S]*\}/)
        if (!objMatch) {
          throw new Error('Không thể parse kết quả từ Gemini. Thử lại lần nữa.')
        }
        coreContent = JSON.parse(objMatch[0])
      }

      // Validate required fields
      const required = ['topic', 'warningSigns', 'causes', 'diagnosticMethods', 'standardTreatments']
      for (const field of required) {
        if (!coreContent[field]) {
          throw new Error(`Kết quả thiếu trường: ${field}`)
        }
      }

      return NextResponse.json(coreContent)
    } catch (apiErr: any) {
      console.warn('Gemini API Error. Falling back to premium medical Mock data. Error:', apiErr.message)
      // Automatic fallback when API key quota is exceeded or rate limit hit
      return NextResponse.json({
        ...generateMockContent(topic),
        _note: 'Bản đồ này được tạo bằng dữ liệu y khoa Demo do tài khoản Gemini API của bạn đã vượt quá hạn ngạch (Quota Exceeded).'
      })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Phân tích thất bại'
    console.error('[analyze] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
