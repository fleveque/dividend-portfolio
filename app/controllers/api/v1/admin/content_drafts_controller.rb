module Api
  module V1
    module Admin
      class ContentDraftsController < BaseController
        # GET /api/v1/admin/content_drafts
        def index
          drafts = ContentDraft.recent(50)
          render_success({ drafts: drafts.map { |d| serialize(d) } })
        end

        # POST /api/v1/admin/content_drafts
        # body: { category: nil|"stock_of_the_day"|... , feature_name:, description: }
        def create
          extras = { feature_name: params[:feature_name], description: params[:description], audience: params[:audience] }
          topic = ContentDrafts::TopicSelector.pick(category: params[:category].presence, extras: extras)

          inputs = ContentDrafts::TopicDataBuilder.build(topic[:category], topic[:topic_key], extras: extras)
          return render_error("No data available for this topic today", status: :unprocessable_entity) if inputs.nil?

          payload = ContentGenerator.call(
            category: topic[:category],
            topic_key: topic[:topic_key],
            inputs: inputs
          )

          draft = ContentDraft.create!(
            topic_type: topic[:category],
            topic_key: topic[:topic_key],
            inputs: inputs,
            payload: payload,
            generated_at: Time.current
          )

          render_success(serialize(draft), status: :created)
        rescue ContentDrafts::TopicSelector::TopicUnavailable => e
          render_error(e.message, status: :unprocessable_entity)
        rescue ContentGenerator::PrivacyViolation => e
          Rails.logger.error "ContentGenerator privacy violation: #{e.message}"
          render_error("Privacy guard rejected the generated draft. See logs.", status: :internal_server_error)
        rescue AiProviders::BaseProvider::AiError => e
          Rails.logger.error "ContentGenerator AI error: #{e.message}"
          render_error("AI provider temporarily unavailable: #{e.message}", status: :service_unavailable)
        end

        # PATCH /api/v1/admin/content_drafts/:id  body: { copied: true|false }
        def update
          draft = ContentDraft.find(params[:id])
          if ActiveModel::Type::Boolean.new.cast(params[:copied])
            draft.update!(copied_at: Time.current)
          else
            draft.update!(copied_at: nil)
          end
          render_success(serialize(draft))
        end

        private

        def serialize(draft)
          payload = draft.payload.deep_symbolize_keys
          x_text = payload.dig(:x, :text).to_s
          li_text = payload.dig(:linkedin, :text).to_s

          {
            id: draft.id,
            topicType: draft.topic_type,
            topicKey: draft.topic_key,
            headline: payload[:headline],
            x: { text: x_text, length: x_text.length, truncated: payload[:truncated_x] == true },
            linkedin: { text: li_text, length: li_text.length, truncated: payload[:truncated_linkedin] == true },
            hashtags: payload[:hashtags] || [],
            inputs: draft.inputs,
            generatedAt: draft.generated_at.iso8601,
            copiedAt: draft.copied_at&.iso8601
          }
        end
      end
    end
  end
end
