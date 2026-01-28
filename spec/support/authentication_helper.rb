module AuthenticationHelper
  def sign_in(user)
    post api_v1_session_path, params: {
      email_address: user.email_address,
      password: user.password || 'password123'
    }
  end
end
