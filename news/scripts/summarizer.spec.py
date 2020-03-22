from mamba import description, it
from nltk.tokenize import sent_tokenize
from summarizer import (_count_occurences, _rank_sentences, _remove_stopwords,
                        _stem, _tokenize, summarize)
from sure import expect  # pylint: disable=W0611

with description('Summarizer:') as self:
    with it('Should stem the words accordingly so that plural words and singular words match'):
        sentences = [['city', 'cities'], [
            'hated', 'hating'], ['theme', 'themes']]
        stemmed = _stem(sentences)
        for sentence in stemmed:
            sentence[0].should.equal(sentence[1])

    with it('should remove stopwords'):
        sentences = [['lord', 'of', 'the', 'rings']]
        removed = _remove_stopwords(sentences)
        removed[0].should.equal(['lord', 'rings'])

    with it('should tokenize the article correctly'):
        article = """
        The world is changed.
        I feel it in the water.
        I feel it in the earth.
        I smell it in the air.
        """
        tokenized = _tokenize(article)
        len(tokenized).should.equal(4)
        word_counts_with_period = [5, 7, 7, 7]
        for i, sentence in enumerate(tokenized):
            len(sentence).should.equal(word_counts_with_period[i])

    with it('should correctly construct the word frequency dict'):
        sentences = [['this', 'is', 'a', 'great', 'sentence'], [
            'this', 'cool', 'word'], ['this'], []]
        counts = _count_occurences(sentences)
        expected_counts = {
            'this': 3,
            'is': 1,
            'cool': 1,
            'word': 1,
            'great': 1,
            'a': 1
        }
        expect(expected_counts).should.equal(expected_counts)

    with it('should correctly rank sentences according to their content'):
        # high_val_sentence should have a higher score
        high_val_sentence = ['Lord', 'of', 'the', 'rings', 'is', 'great']
        low_val_sentence = ['Harry', 'Potter', 'is', 'great']
        sentences = [high_val_sentence, low_val_sentence]
        WORD_FREQ = {
            'Lord': 8,
            'of': 9,
            'the': 9,
            'rings': 10,
            'is': 4,
            'great': 3,
            'Harry': 1,
            'Potter': 1
        }
        ranked = _rank_sentences(sentences, WORD_FREQ)
        ranked[0][1].should.be.greater_than(ranked[1][1])
    
    with it('should return the sentences in a chronological order'):
        article = """
        The world is changed.
        I feel it in the water.
        I feel it in the earth.
        I smell it in the air.
        """
        summary = summarize(article, 2)
        tokenized_article = sent_tokenize(article)
        tokenized_summary = sent_tokenize(summary)
        tokenized_article.index(tokenized_summary[0]).should.be.lower_than(tokenized_article.index(tokenized_summary[1]))
