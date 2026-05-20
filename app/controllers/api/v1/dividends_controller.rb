module Api
  module V1
    class DividendsController < BaseController
      # GET /api/v1/dividends
      def index
        dividends = Current.user.dividends.includes(:stock).ordered
        render_success(dividends.map { |d| serialize(d) })
      end

      # POST /api/v1/dividends   body: { stock_id, date, per_share_amount, quantity, amount, currency, withholding_tax }
      def create
        dividend = Current.user.dividends.new(create_params.merge(source: "manual"))
        if dividend.save
          render_success(serialize(dividend), status: :created)
        else
          render_error(dividend.errors.full_messages.join(", "), status: :unprocessable_entity)
        end
      end

      # PATCH /api/v1/dividends/:id
      def update
        dividend = Current.user.dividends.find(params[:id])
        if dividend.update(update_params)
          render_success(serialize(dividend))
        else
          render_error(dividend.errors.full_messages.join(", "), status: :unprocessable_entity)
        end
      end

      # DELETE /api/v1/dividends/:id  — only manual rows can be hand-deleted.
      # Imported rows survive deletion via re-import; the user can re-run the
      # importer (or wipe via console) if they truly want them gone.
      def destroy
        dividend = Current.user.dividends.find(params[:id])
        return render_error("Imported dividends can't be deleted manually", status: :unprocessable_entity) if dividend.source != "manual"

        dividend.destroy!
        render_success({ deleted: true })
      end

      # GET /api/v1/dividends/chart_data?range=full
      # Default: 12 months back + 12 months forward.
      # `range=full`: from the user's first recorded dividend + 12 months forward.
      def chart_data
        data = Dividends::ChartData.call(user: Current.user, range: params[:range])
        render_success(data)
      end

      # POST /api/v1/dividends/import_preview   body: multipart file=...
      # Parses the file and returns a non-destructive preview of what we'd import.
      def import_preview
        file = params[:file]
        return render_error("Missing file", status: :unprocessable_entity) if file.blank?

        tempfile = file.tempfile
        begin
          parsed = DividendImporters::Dispatcher.parse(tempfile)
          source = parsed.delete(:source) || "ibkr"
          preview = DividendImports::Preview.call(parsed: parsed, user: Current.user)
          render_success(preview.merge(source: source))
        rescue StandardError => e
          Rails.logger.error "Dividend import preview failed: #{e.class}: #{e.message}"
          render_error("Could not parse the file: #{e.message}", status: :unprocessable_entity)
        ensure
          # Belt-and-suspenders: Rack/Tempfile's finalizer would unlink this
          # eventually, but we delete it the moment parsing finishes so the
          # file — which contains the user's positions and amounts — never
          # lingers on the filesystem.
          tempfile&.close
          tempfile&.unlink if tempfile.respond_to?(:unlink)
        end
      end

      # POST /api/v1/dividends/import_apply   body: { rows: [...], mapping: { ticker => stock_id }, source: 'ibkr'|'myinvestor' }
      def import_apply
        rows = symbolize_rows(params[:rows] || [])
        raw_mapping = params[:mapping]
        mapping = (raw_mapping.respond_to?(:to_unsafe_h) ? raw_mapping.to_unsafe_h : raw_mapping || {}).transform_values(&:to_i)
        source = params[:source].to_s.presence
        source = "ibkr" unless Dividend::SOURCES.include?(source) && source != "manual"

        result = DividendImports::Apply.call(user: Current.user, rows: rows, manual_mapping: mapping, source: source)
        render_success(result)
      end

      private

      def create_params
        params.require(:dividend).permit(:stock_id, :date, :per_share_amount, :quantity, :amount, :currency, :withholding_tax)
      end

      def update_params
        params.require(:dividend).permit(:date, :per_share_amount, :quantity, :amount, :currency, :withholding_tax)
      end

      # JSON body from the import_apply endpoint carries the preview rows with
      # string keys. Coerce to the symbol/decimal shape that the Apply service
      # expects.
      def symbolize_rows(rows)
        rows.map do |r|
          h = r.respond_to?(:to_unsafe_h) ? r.to_unsafe_h : r
          {
            ticker: h["ticker"],
            stock_id: h["stock_id"]&.to_i,
            currency: h["currency"],
            date: Date.parse(h["date"]),
            per_share_amount: BigDecimal(h["per_share_amount"].to_s),
            amount: BigDecimal(h["amount"].to_s),
            quantity: h["quantity"]&.to_i,
            withholding_tax: BigDecimal((h["withholding_tax"] || 0).to_s)
          }
        end
      end

      def serialize(dividend)
        stock = dividend.stock
        {
          id: dividend.id,
          stockId: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          date: dividend.date.iso8601,
          perShareAmount: dividend.per_share_amount&.to_f,
          quantity: dividend.quantity,
          amount: dividend.amount.to_f,
          currency: dividend.currency,
          withholdingTax: dividend.withholding_tax.to_f,
          netAmount: dividend.net.to_f,
          source: dividend.source
        }
      end
    end
  end
end
