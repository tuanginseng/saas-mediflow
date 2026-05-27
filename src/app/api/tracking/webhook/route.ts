import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initializing server-side client with high privileges for lead distribution operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { event, url, utmData, leadData } = payload

    if (!event) {
      return NextResponse.json({ error: 'Thiếu trường event trong Webhook payload' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Log the incoming tracking event for telemetry/stream
    console.log(`[Webhook Event Ingested]: ${event} from ${url}`, utmData)

    let assignedTelesaleId = null
    let roundRobinStatus = 'N/A'

    // If the event is CTA submission and contains lead data, run the Round-Robin lead distribution
    if (event === 'Click_CTA' && leadData && leadData.phone) {
      try {
        // 1. Fetch all active telesale profiles
        const { data: telesales, error: teleErr } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'telesale')
          .eq('is_active', true)

        if (teleErr) throw teleErr

        if (telesales && telesales.length > 0) {
          // 2. Query the last assigned lead to determine round-robin turn
          const { data: lastLeads, error: lastLeadErr } = await supabase
            .from('leads')
            .select('assigned_to')
            .not('assigned_to', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1)

          if (lastLeadErr) throw lastLeadErr

          const lastAssignedId = lastLeads && lastLeads.length > 0 ? lastLeads[0].assigned_to : null

          // 3. Round-Robin Index calculation
          let nextIndex = 0
          if (lastAssignedId) {
            const currentIndex = telesales.findIndex(t => t.id === lastAssignedId)
            if (currentIndex !== -1) {
              nextIndex = (currentIndex + 1) % telesales.length
            }
          }

          const targetTelesale = telesales[nextIndex]
          assignedTelesaleId = targetTelesale.id
          roundRobinStatus = `Đã phân bổ xoay vòng (Round-Robin) cho Telesale: ${targetTelesale.full_name}`

          // 4. Save/Insert the lead with assigned telesale ID
          const { error: insertErr } = await supabase
            .from('leads')
            .insert({
              clinic_id: '00000000-0000-0000-0000-000000000001',
              full_name: leadData.name || 'Bệnh nhân ẩn danh',
              phone: leadData.phone,
              email: leadData.email || null,
              status: 'new',
              source: utmData?.utm_source || 'organic',
              utm_data: utmData || {},
              assigned_to: assignedTelesaleId,
              notes: `Lead tự động phân phối từ Webhook (Sự kiện: ${event})`
            })

          if (insertErr) throw insertErr
        } else {
          roundRobinStatus = 'Không tìm thấy Telesale hoạt động. Lưu lead không phân bổ.'
          // Create lead without allocation
          await supabase.from('leads').insert({
            clinic_id: '00000000-0000-0000-0000-000000000001',
            full_name: leadData.name || 'Bệnh nhân ẩn danh',
            phone: leadData.phone,
            email: leadData.email || null,
            status: 'new',
            source: utmData?.utm_source || 'organic',
            utm_data: utmData || {}
          })
        }
      } catch (distErr: any) {
        console.error('Lead distribution algorithm error:', distErr.message)
        roundRobinStatus = `Lỗi phân phối: ${distErr.message}. Tự động lưu lead cục bộ.`
      }
    }

    return NextResponse.json({
      success: true,
      receivedEvent: event,
      timestamp: new Date().toISOString(),
      roundRobin: roundRobinStatus,
      assignedTelesaleId
    })
  } catch (error: any) {
    console.error('[tracking-webhook] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
