$('#blog-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/blogs?' + search, function(data) {
    $('#blog-grid').html('');
    data.forEach(function(blog) {
      $('#blog-grid').append(`
         <div class="item">
            <div class="image">
              <img src="${ blog.image }">
            </div>
            <div class="content">
              <a class="header">${ blog.title }</a>
              <div class="meta">
                <span class="cinema">${ new Date(blog.created).toDateString() }</span>
              </div>
              <div class="description">
                <p>${ blog.description.substring(0,50) } ...</p>
              </div>
              <div class="extra">
                <a href="/blogs/${ blog._id }">
                  <div class="ui animated violet basic button" tabindex="0">
                <div class="visible content">Read More</div>
                <div class="hidden content">
                  <i class="right arrow icon"></i>
                </div>
              </div>
                </a>
              </div>
            </div>
          </div>
      `);
    });
  });
});

$('#blog-search').submit(function(event) {
  event.preventDefault();
});