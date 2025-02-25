module AuthenticationHelper
  def sign_in(user)
    post session_path, params: {
      email_address: user.email_address,
      password: user.password || 'password123'
    }
    follow_redirect! if response.redirect?
  end
end
