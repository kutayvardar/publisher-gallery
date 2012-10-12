if (!window.DM_PublisherGallery && !window.DM_ApiV1Hook && window.jQuery)
{
    DM_PublisherGallery = (function(){
        var
            // (string) container
            containerId,

            // (array) list of all the categories
            categories = [],

            // (integer) current page number
            currentPage = 1,

            // (string) link to the video gallery
            href,

            // (object) player parameters
            playerParameters = { 'autoplay': 1, 'syndication': '' },

            // (array) Auhtorized player parameters
            authorizedPlayerParameters = ['related', 'logo', 'syndication'],

            // (string) current category
            currentCategory,

            // (string) selected Video (if a video is specified in the hash)
            selectedVideo,

            // (string) text to display in the load more button
            loadMoreText = 'Show more videos',

            // (object) parameters for the api Call
            apiCallParameters = { fields: 'id,title,thumbnail_small_url,thumbnail_medium_url,thumbnail_large_url,thumbnail_url,description', page: 1, limit: 12 },

            // (integer) default number of videos to load per call
            limit = 12,

            // (integer) number of columns for the videoblock
            columns = 1;

            // (integer) default number of videos to load per call
            width = '100%',

            // (boolean) should we load the google analytics tracker
            gaLoad = true;

        function init(parameters)
        {
            // load the css in the page
            includeCss('');

            // retrieve the hash parameters #category=xxxx&vid=xxxx
            getHashParameters();

            // set the player Parameters
            setPlayerParameters(parameters);

            if (parameters.hasOwnProperty('containerId'))
            {
                containerId = '#'+ parameters.containerId;

                // custom load more text
                if (parameters.hasOwnProperty('loadMore'))
                {
                    loadMoreText = parameters.loadMore;
                }

                // custom nb of videos to load per call 
                if (parameters.hasOwnProperty('limit'))
                {
                    limit = parameters.limit;
                }

                // custom width for the container
                if (parameters.hasOwnProperty('width'))
                {
                    width = parameters.width;
                }

                // nb of columns for the video block
                if (parameters.hasOwnProperty('columns'))
                {
                    columns = parameters.columns;
                }

                if (parameters.hasOwnProperty('categories'))
                {
                    setCategories(parameters.categories);
                }

                else if(parameters.hasOwnProperty('list') && parameters.hasOwnProperty('href'))
                {  
                    currentCategory = parameters.list;
                    href = parameters.href;
                    getVideos(setVideoBlock);
                }

                else
                {
                    logError('Missing parameters: videoblock should have at least the following parameters [list, href], and video gallery the following one[categories]');
                }   
            }

            else
            {
                logError('Undefined widget containerId');
            }

            // enable the tracking
            gaTrack();
        }

        /**
         * Get the hash parameters
         *
         */
        function getHashParameters()
        {
            hash = window.location.hash.replace('#', '');
            hash = hash.split('&');

            jQuery(hash).each(function(index, value){
                if(value.match('category='))
                {
                    currentCategory = value.replace('category=', '');
                }

                else if(value.match('vid='))
                {
                    selectedVideo = value.replace('vid=', '');
                }
            });
        }

        /**
         * Set player parameters
         *
         * @param object parameters
         */
        function setPlayerParameters(parameters)
        {
            jQuery(authorizedPlayerParameters).each(function(index, param){
                if (parameters.hasOwnProperty(param))
                {
                    playerParameters[param] = parameters[param];
                }
            });
        }

        /**
         * Set the categories
         *
         * @param object cat
         */
        function setCategories(cat)
        {
            var count = cat.length,
                hasTitle = 0,
                retrievingTitle = 0;
                
            jQuery(cat).each(function(index, value){
                // a specific title has been defined for this list
                if (jQuery.isPlainObject(value) && value.hasOwnProperty('list') && value.hasOwnProperty('title'))
                {
                    hasTitle++;
                }

                // no title has been defined, we need to retrieve it from DM (+ we only retrieve one title at a time)
                else if (retrievingTitle == 0)
                {
                    retrievingTitle = 1;
                    getCategoryName(value, cat);
                }
            });
            
            // we have retrieved all the titles
            if (hasTitle == count)
            {
                // we store them in a clean function wide variable
                categories = cat;
                setGalleryMenu();
            }
        }

        /**
         * Set the category name
         *
         * @param string list
         */
        function getCategoryName(list, cat)
        {            
            var field = 'name',
                categoryIndex = jQuery.inArray(list, cat);

            if (list.match('/user'))
            {
                field = 'screenname';
            }

            DM.api(list, { fields: field }, function(response){
                cat[categoryIndex] = { list: list, title: response[field] };                
                setCategories(cat);
            });
        }

        /**
         * Set the Gallery Menu
         *
         */
        function setGalleryMenu()
        {   
            var menu = '<ul>';

            jQuery(containerId).html('<div id="publisher_gallery_menu"></div><div style="clear:both;"></div>');

            jQuery(categories).each(function(index, category){
                menu += '<li><a href="'+ category.list +'">'+ category.title +'</a></li>';
            });

            menu += '</ul>';

            jQuery('#publisher_gallery_menu').html(menu);

            jQuery('#publisher_gallery_menu').find('a').click(function(e){
                e.preventDefault();
                var href = jQuery(this).attr('href').replace('http://'+ window.location.hostname, ''); // bug fix for IE 7 (by default adds the host name to relative URLs)
                setCurrentCategory(href);
            });

            // if no specific category has been passed via the hash, we load the first list
            if (!currentCategory)
            {
                setCurrentCategory(categories[0]['list']);
            }

            else
            {
                setCurrentCategory(currentCategory);
            }
        }

        /**
         * Set Current Category
         *
         * @param string categoryList
         */
        function setCurrentCategory(categoryList)
        {
            // show some activity
            jQuery.fancybox.showLoading();

            $categoryMenu = jQuery(containerId).find('#publisher_gallery_menu li');
            
            // remove the visual indicator of the selected section
            $categoryMenu.removeClass('selected');
            
            // init the current page
            currentPage = 1;

            if (jQuery(containerId).find('#publisher_gallery_video_list'))
            {
                jQuery(containerId).find('#publisher_gallery_video_list').remove();
                jQuery(containerId).find('#publisher_load_more').remove();
                jQuery(containerId).find('.publisher_clear').remove();
            }

            if (categoryList)
            {
                jQuery(categories).each(function(index, value){
                    if (value.list == categoryList)
                    {
                        currentCategory = categoryList;

                        // select this section
                        $categoryMenu.eq(index).addClass('selected');

                        // generate the gallery
                        getVideos(setGallery);
                    }
                });
            }
        }

        /**
         * Retrieve the videos from Dailymotion
         *
         */
        function getVideos(callback)
        {
            var pattern = new RegExp('/mychannel/([a-zA-Z0-9-_]{1,30})', 'i'),
                res,
                method = currentCategory +'/videos';

            if (currentCategory.match('mychannel'))
            {
                res = pattern.exec(currentCategory);
                if (res[1])
                {
                    method = '/user/'+ res[1] +'/subscriptions';
                }
            }

            apiCallParameters['page'] = currentPage;
            apiCallParameters['limit'] = limit;

            DM.api(method, apiCallParameters, function(response){
                
                callback(response);
            });
        }

        /**
         * Set Gallery properties
         *
         * @param object parameters
         */
        function setGallery(response)
        {            
            if (currentPage == 1)
            {
                jQuery(containerId).append('<div id="publisher_gallery_video_list"></div>');
                jQuery(containerId).append('<div class="publisher_clear"></div><center><div id="publisher_load_more">'+ loadMoreText +'</div></center>'); // add the center tag tofix a display bug in IE

                jQuery(containerId).find('#publisher_load_more').click(function(){
                    getNextPage();
                });

                if (selectedVideo)
                {
                    playVideo(selectedVideo);
                    selectedVideo = undefined;
                }  

                $gallery = jQuery(containerId).find('#publisher_gallery_video_list');
               
                setGallerySize($gallery);

                jQuery(window).on('resize', function(){
                    setGallerySize($gallery)
                });
            }

            if (!$gallery)
            {
                $gallery = jQuery(containerId).find('#publisher_gallery_video_list');
            }
            
            var videoList = '';

            jQuery(response.list).each(function(i, video){
                videoList += '<div class="publisher_gallery_video '+ video['id'] +'">'
                          +   '     <div class="publisher_gallery_thumb " style="background:url('+ video['thumbnail_large_url'] +') no-repeat center top;"></div>'
                          +   '     <div class="publisher_gallery_title_container">'
                          +   '         <div class="publisher_gallery_title">'
                          +                 video['title'].truncate(30, true)
                          +   '         </div>'
                          +   '     </div>'
                          +   '     <div class="publisher_gallery_play_button"></div>'
                          +   '</div>';
            });

            // add the videos to the gallery
            $gallery.append(videoList);

            // hide the loading wheel
            jQuery.fancybox.hideLoading();

            // bind click to the lightbox
            setLightbox();

            // hide the load more button if there are no other videos
            if (!response.has_more)
            {
                jQuery(containerId).find('#publisher_load_more').hide();
            }
        }

        function setGallerySize($gallery)
        {
            $gallery.css({ 'width': '100%', 'margin': 0});

            var nbVideos, realWidth, margin;
            // 320 = a video element width + the 10px padding
            nbVideos = Math.floor($gallery.width() / 320);
            
            // how many pixel are the videos really using
            realWidth = 320 * nbVideos;
            
            // what margin should we apply to align the gallery in the center
            margin = ($gallery.width() - realWidth) / 2;

            // apply this margin
            $gallery.css({'width': realWidth, 'margin-left': margin });
        }

        /**
         * Set Lightbox
         *
         */
        function setLightbox()
        {
            jQuery('.publisher_gallery_video').click(function(){
                divClass = jQuery(this).attr('class').split(' ');

                if (divClass.length >= 2)
                {
                    videoId = divClass[1];

                    jQuery.fancybox.open({ 
                        type: 'iframe', 
                        href: 'http://www.dailymotion.com/embed/video/'+ videoId +'?'+ jQuery.param(playerParameters),
                        width: 560, 
                        height: 315, 
                        scrolling: 'no', 
                        padding:0,
                        autoSize : false
                    });

                    _gaq.push(
                        ['DM_PublisherGallery._trackEvent', 'Views', 'Syndication Key', ''+playerParameters.syndication+''],
                        ['DM_PublisherGallery._trackEvent', 'Views', 'Video Id', videoId],
                        ['DM_PublisherGallery._trackEvent', 'Views', 'Domain', window.location.href]
                    );
                }
            });
        }

        /**
         * Play a specific video
         *
         * @param string xid
         */
        function playVideo(xid)
        {
            jQuery.fancybox.open({ 
                type: 'iframe', 
                href: 'http://www.dailymotion.com/embed/video/'+ xid +'?'+ jQuery.param(playerParameters),
                width: 560, 
                height: 315, 
                scrolling: 'no', 
                padding:0,
                autoSize : false
            });

            _gaq.push(
                ['DM_PublisherGallery._trackEvent', 'Views', 'Syndication Key', ''+playerParameters.syndication+''],
                ['DM_PublisherGallery._trackEvent', 'Views', 'Video Id', xid],
                ['DM_PublisherGallery._trackEvent', 'Views', 'Domain', window.location.href]
            );
        }

        /**
         * Get Next Page
         *
         */
        function getNextPage()
        {
            // we show some activity
            jQuery.fancybox.showLoading();

            currentPage++;

            getVideos(setGallery);
        }

        /**
         * Used to load the css for the widgets
         *
         * @param string styleSheetUrl
         */
        function includeCss(styleSheetUrl) 
        {
            var css = document.createElement('link');
            css.setAttribute('rel', 'stylesheet');
            css.setAttribute('type', 'text/css');
            css.setAttribute('href', styleSheetUrl);
            document.getElementsByTagName('head')[0].appendChild(css);
        }

        /** 
         * Log error to help debugging
         *
         * @param Object args
         */
        function logError(args) 
        {
            if (window.Debug && window.Debug.writeln)
            {
                window.Debug.writeln(args);
            }
            else if (window.console)
            {
                window.console.log(args);
            }
        }

        /** 
         * Google Analytics tracking
         *
         */
        function gaTrack()
        {
            window._gaq = window._gaq || [];
            _gaq.push(['DM_PublisherGallery._setAccount', 'UA-28845982-4']);
            _gaq.push(['DM_PublisherGallery._setDomainName', 'none']);
            _gaq.push(['DM_PublisherGallery._trackPageview']);

            (function() {
                if (gaLoad)
                {
                    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
                    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);  
                }
            })();
        }

        /** 
         * Set the video block
         *
         * @param string parameters
         */
        function setVideoBlock(response)
        {
            jQuery(containerId).html('<div id="publisher_videoblock"></div>');

            $videoblock = jQuery(containerId).find('#publisher_videoblock');

            $videoblock.css('width', width);
            
            var code = '',
                singleWidth = Math.floor(width / columns),
                truncateLength = 100,
                thumbnailSize = 'thumbnail_large_url',
                height = Math.round(singleWidth / 1.875);

            // if a custom width has been defined
            if (singleWidth)
            {
                // if the width is above 320px we crop the original thumbnail
                if (singleWidth > 320)
                {
                    thumbnailSize = 'thumbnail_url';
                }

                // if the witdth is between 160 & 320px we use the large thumbnail
                else if (singleWidth <= 320 && singleWidth > 160)
                {
                    thumbnailSize = 'thumbnail_large_url';
                }

                // otherwise we use the medium thumbnail and we prefer a more squared image format
                else
                {
                    truncateLength = getTruncateLength(singleWidth);
                    thumbnailSize = 'thumbnail_medium_url';
                    height = Math.round(singleWidth / 1.33);
                }
            }

            jQuery(response.list).each(function(index, video){
                code    +=  '<div class="dm_publisher_video '+ video['id'] +'" style="height: '+ height +'px;" title="'+ video['title'] +'">'
                        +   '   <div>'
                        +   '       <div class="dm_publisher_thumb" style="background:url('+ video[thumbnailSize] +') no-repeat center center; height: '+ height +'px;"></div>'
                        +   '   </div>'
                        +   '   <div class="dm_publisher_play"></div>'
                        +   '   <div class="dm_publisher_title">'
                        +   '       <div style="padding:10px;">'+ video['title'].truncate(truncateLength, true) +'</div>'
                        +   '   </div>'
                        +   '</div>';
            });

            $videoblock.html(code);

            jQuery.fancybox.hideLoading();

            $videoblock.find('.dm_publisher_video').css('width', singleWidth);

            // adjust the position of the play button on the thumbnail
            $videoblock.find('.dm_publisher_play').css({'top': Math.round((height - 40)/2), 'left': Math.round((singleWidth - 45)/2)});

            // adjust the title layer size
            $videoblock.find('.dm_publisher_title').css({'width': singleWidth+'px', 'height': height +'px', 'left': 0});

            // on mouse over we show the video title, when the mouse leave we hide it and display the play button
            jQuery('.dm_publisher_video').mouseover(function(){
                jQuery(this).find('.dm_publisher_play').hide();
                jQuery(this).find('.dm_publisher_title').show();
            }).mouseout(function(){
                jQuery(this).find('.dm_publisher_play').show();
                jQuery(this).find('.dm_publisher_title').hide();
            });

            jQuery('.dm_publisher_video').click(function(){
                divClass = jQuery(this).attr('class').split(' ');

                if (divClass.length >= 2)
                {
                    videoId = divClass[1];

                    window.location.replace(href + '#category='+ currentCategory +'&vid='+ videoId);
                }
            });
        }

        /** 
         * Get Truncate Length
         *
         * @param integer width
         * @return integer 
         */
        function getTruncateLength(width) 
        {
            // very rough estimate in order to fit on one line
            return Math.round(width / 8);
        }

        /** 
         * Truncate a text
         *
         * @return string
         */
        String.prototype.truncate = function(nbLetters, useWordBoundary) 
        {
            // is the original string longer than the maximumb number of letters we would like to have
            var toLong = this.length > nbLetters,
                s_ = toLong ? this.substr(0, nbLetters - 1) : this;

                // if we want to shorten the text, but not in the middle of a word 
                s_ = useWordBoundary && toLong ? s_.substr(0, s_.lastIndexOf(' ')) : s_;

            // if the original string was too long, we return the truncated string+ the triple dots, other we return the original
            return  toLong ? s_ +'...' : s_;
        };

        return {
            init: init
        };
    })();

    window.dmAsyncInit = function()
    {
        DM.init({status: true, cookie: true});

        // call the hook containing the parameters
        if (jQuery.isFunction(window.dmPublisherAsyncInitGallery))
        {
            jQuery.fancybox.showLoading();
            window.dmPublisherAsyncInitGallery();   
        }
            
    };
    (function() {
        var e = document.createElement('script'); e.async = true;
        e.src = document.location.protocol + '//api.dmcdn.net/all.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(e, s);
    }());
}