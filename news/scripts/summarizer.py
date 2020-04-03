import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from nltk.tokenize import sent_tokenize, word_tokenize

nltk.download('punkt')
nltk.download('stopwords')
STOPWORDS_SET = set(stopwords.words('english'))


def _remove_stopwords(sentences):
    """ Removes very common words such as 'a' and 'the

    Arguments:
        #
        tokenized_words {string list} -- 2D list of strings in which the 
        1st index represents sentence and 2nd index represents word # for that sentence
    Returns:
        ndlist -- 2D list much like the input, but with the common words removed
    """
    return [[word for word in sentence if word not in STOPWORDS_SET]
            for sentence in sentences]


def _tokenize(article):
    """ Tokenizes the article into sentences and words

    Arguments:
        article {string} -- string that will get tokenized

    Returns:
        ndlist -- 2D list in which the 1st index represents sentence #
        and 2nd index represents word # for that sentence
    """
    sentences = sent_tokenize(article)
    words = [word_tokenize(a) for a in sentences]
    return words


def _stem(sentences):
    """Takes a 2d list of words and stems all the words
    e.g city, cities -> citi, citi

    Arguments:
        sentences {ndlist} -- a 2D array containing words that will be stemmed

    Returns:
        ndlist -- 2D list of stemmed words
    """
    stemmer = PorterStemmer()
    words = [[stemmer.stem(word) for word in sent] for sent in sentences]
    return words


def _count_occurences(sentences):
    """Takes a 2d list of words and returns the frequency of each words

    Arguments:
        sentences {ndlist} -- a 2D array containing words

    Returns:
        [dict] -- Dict that maps a word to its count
    """
    count_dict = {}
    for sentence in sentences:
        for word in sentence:
            count = count_dict.get(word, 0)
            count_dict[word] = count + 1

    return count_dict


def _rank_sentences(sentences, count_dict):
    """Rank sentences depending on their score, which is calculated using word frequencies

    Arguments:
        sentences {ndlist} -- a 2D array containing words
        count_dict {dict} -- Dict that maps a word to its count

    Returns:
        list -- a list of tuples. The first element refers to the index of the sentence.
        The second refers to its rank among the other sentences.
    """
    def calculate_score(sentence):
        """Returns a score for a given sentence

        Arguments:
            sentence {list} -- list of strings
        """
        score = 0
        for word in sentence:
            score += count_dict[word]
        return score / len(sentence)

    sent_ranks = []
    for i, sentence in enumerate(sentences):
        if len(sentence) == 0:
            continue
        sent_tuple = (i, calculate_score(sentence))
        sent_ranks.append(sent_tuple)
    return sent_ranks


def summarize(article, n_sentences):
    """This function takes in a string and summarizes it

    Arguments:
        article {string} -- The string that is going to get summarized
        n_sentences {integer} -- The number of sentences the summary will contain
    """
    tokenized_article = _tokenize(article)
    sw_removed = _remove_stopwords(tokenized_article)
    stemmed_words = _stem(sw_removed)
    word_freq = _count_occurences(stemmed_words)
    ranked_indexes = _rank_sentences(stemmed_words, word_freq)
    sorted_ranks = sorted(ranked_indexes, key=lambda x: x[1], reverse=True)[
        :n_sentences]
    sorted_chronologically = sorted(sorted_ranks, key=lambda x: x[0])
    tokenized_sent = sent_tokenize(article)
    summarized_list = [tokenized_sent[i]
                       for i, _ in sorted_chronologically]
    return ' '.join(summarized_list)
